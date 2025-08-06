const io = require('socket.io')({
  cors: {
    origin: '*',
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
  serveClient:false
});
const jwt=require("./jwt");
const store=require("./store");
const util={
  async login(user,socket,isReconnect) {
    let ip=socket.handshake.address.replace(/::ffff:/,"");
    const headers = socket.handshake.headers;
    const realIP = headers['x-forwarded-for'];
    ip=realIP?realIP:ip;
    const deviceType=this.getDeviceType(socket.handshake.headers["user-agent"].toLowerCase());
    user.ip=ip;
    user.deviceType=deviceType;
    user.roomId=socket.id;
    user.type='user';
    
    if(isReconnect){
      this.loginSuccess(user,socket);
      console.log(`用戶<${user.name}>重新鏈接成功！`)
    }else {
      try {
        // 验证用户登录
        const validatedUser = await store.validateUser(user.email, user.password);
        if(validatedUser){
          // 检查用户是否已在线
          const isOnline = await this.isUserOnline(validatedUser.id);
          if(!isOnline){
            validatedUser.id = socket.id;
            validatedUser.time = new Date().getTime();
            validatedUser.ip = ip;
            validatedUser.deviceType = deviceType;
            validatedUser.roomId = socket.id;
            this.loginSuccess(validatedUser,socket);
            store.saveUser(validatedUser,'login')
            const messages = await store.getMessages();
            socket.emit("history-message","group_001",messages);
          }else {
            console.log(`登錄失敗,用戶<${validatedUser.name}>已在線!`)
            socket.emit('loginFail','登錄失敗,用戶已在線!')
          }
        }else {
          console.log(`登錄失敗,郵箱或密碼錯誤!`)
          socket.emit('loginFail','登錄失敗,郵箱或密碼錯誤!')
        }
      } catch (error) {
        console.log(`登錄失敗: ${error.message}`)
        socket.emit('loginFail',`登錄失敗: ${error.message}`)
      }
    }
  },

  async register(user,socket) {
    let ip=socket.handshake.address.replace(/::ffff:/,"");
    const headers = socket.handshake.headers;
    const realIP = headers['x-forwarded-for'];
    ip=realIP?realIP:ip;
    const deviceType=this.getDeviceType(socket.handshake.headers["user-agent"].toLowerCase());
    
    try {
      user.id = socket.id;
      user.time = new Date().getTime();
      user.ip = ip;
      user.deviceType = deviceType;
      user.roomId = socket.id;
      user.type = 'user';
      
      // 注册新用户
      const newUser = await store.registerUser(user);
      this.loginSuccess(newUser,socket);
      store.saveUser(newUser,'login')
      const messages = await store.getMessages();
      socket.emit("history-message","group_001",messages);
      console.log(`新用戶<${newUser.name}>註冊成功！`)
    } catch (error) {
      console.log(`註冊失敗: ${error.message}`)
      socket.emit('registerFail',`註冊失敗: ${error.message}`)
    }
  },
  async loginSuccess(user, socket) {
    const data={
      user:user,
      token:jwt.token(user)
    };
    socket.broadcast.emit('system', user, 'join');
    
    // 处理普通消息
    socket.on('message',(from, to,message,type)=> {
      if(to.type==='user'){
        socket.broadcast.to(to.roomId).emit('message', socket.user, to,message,type);
      }
      if(to.type==='group'){
        socket.broadcast.emit('message', socket.user,to,message,type);
        store.saveMessage(from,to,message,type)
      }
    });

    // 处理房间消息
    socket.on('room-message',(from, roomId, message, type)=> {
      socket.to(roomId).emit('room-message', socket.user, roomId, message, type);
      store.saveRoomMessage(from, roomId, message, type);
    });

    // 创建房间
    socket.on('create-room', (roomData) => {
      this.createRoom(roomData, socket);
    });

    // 加入房间
    socket.on('join-room', (roomId) => {
      this.joinRoom(roomId, socket);
    });

    // 离开房间
    socket.on('leave-room', (roomId) => {
      this.leaveRoom(roomId, socket);
    });

    // 关闭房间
    socket.on('close-room', (roomId) => {
      this.closeRoom(roomId, socket);
    });

    // 获取房间列表
    socket.on('get-rooms', async () => {
      const rooms = await this.getRoomsList();
      socket.emit('rooms-list', rooms);
    });

    // 获取房间用户列表
    socket.on('get-room-users', async (roomId) => {
      const users = await this.getRoomUsers(roomId);
      socket.emit('room-users-list', roomId, users);
    });

    const users=await this.getOnlineUsers();
    socket.user=user;
    socket.emit('loginSuccess', data, users);
  },
  //根據useragent判讀設備類型
  getDeviceType(userAgent){
    let bIsIpad = userAgent.match(/ipad/i) == "ipad";
    let bIsIphoneOs = userAgent.match(/iphone os/i) == "iphone os";
    let bIsMidp = userAgent.match(/midp/i) == "midp";
    let bIsUc7 = userAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
    let bIsUc = userAgent.match(/ucweb/i) == "ucweb";
    let bIsAndroid = userAgent.match(/android/i) == "android";
    let bIsCE = userAgent.match(/windows ce/i) == "windows ce";
    let bIsWM = userAgent.match(/windows mobile/i) == "windows mobile";
    if (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
      return "phone";
    } else {
      return "pc";
    }
  },
  //獲取在線用戶列表
  async getOnlineUsers(){
    const users=[];
    const clients=await io.fetchSockets();
    clients.forEach((item) => {
      if(item.user){
        users.push(item.user)
      }
    })
    return users;
  },

  // 获取房间列表
  async getRoomsList(){
    try {
      const rooms = await store.getRooms();
      return rooms.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        owner_name: room.owner_name,
        is_open: room.is_open === 1,
        max_users: room.max_users,
        current_users: room.current_users,
        created_at: room.created_at
      }));
    } catch (error) {
      console.error('获取房间列表失败:', error);
      return [];
    }
  },

  // 获取房间内用户
  async getRoomUsers(roomId){
    const users=[];
    const clients=await io.fetchSockets();
    clients.forEach((item) => {
      if(item.user && item.user.roomId === roomId){
        users.push(item.user)
      }
    })
    return users;
  },
  //判斷用戶是否已經存在
  async isHaveName(name){
    const users=await this.getOnlineUsers();
    return users.some(item => item.name===name)
  },

  // 检查用户是否在线
  async isUserOnline(userId){
    const users=await this.getOnlineUsers();
    return users.some(item => item.id===userId)
  },

  // 创建房间
  async createRoom(roomData, socket) {
    try {
      const room = {
        id: roomData.id,
        name: roomData.name,
        description: roomData.description || '',
        owner_id: socket.user.id,
        owner_name: socket.user.name,
        max_users: roomData.max_users || 50
      };
      
      await store.createRoom(room);
      console.log(`房间<${room.name}>创建成功！`);
      
      // 通知所有用户房间列表更新
      const rooms = await this.getRoomsList();
      io.emit('rooms-updated', rooms);
      
      socket.emit('room-created', room);
    } catch (error) {
      console.error('创建房间失败:', error);
      socket.emit('room-create-failed', error.message);
    }
  },

  // 加入房间
  async joinRoom(roomId, socket) {
    try {
      const room = await store.getRoomById(roomId);
      if (!room) {
        socket.emit('join-room-failed', '房间不存在');
        return;
      }
      
      if (room.is_open === 0) {
        socket.emit('join-room-failed', '房间已关闭');
        return;
      }
      
      // 离开当前房间
      if (socket.user.roomId && socket.user.roomId !== roomId) {
        socket.leave(socket.user.roomId);
      }
      
      // 加入新房间
      socket.join(roomId);
      socket.user.roomId = roomId;
      
      // 更新房间用户数量
      const roomUsers = await this.getRoomUsers(roomId);
      await store.updateRoomUserCount(roomId, roomUsers.length);
      
      // 获取房间消息历史
      const messages = await store.getRoomMessages(roomId);
      socket.emit('room-history', roomId, messages);
      
      // 通知房间内其他用户
      socket.to(roomId).emit('user-joined-room', socket.user, roomId);
      
      // 通知所有用户房间列表更新
      const rooms = await this.getRoomsList();
      io.emit('rooms-updated', rooms);
      
      console.log(`用户<${socket.user.name}>加入房间<${room.name}>`);
    } catch (error) {
      console.error('加入房间失败:', error);
      socket.emit('join-room-failed', error.message);
    }
  },

  // 离开房间
  async leaveRoom(roomId, socket) {
    try {
      socket.leave(roomId);
      socket.user.roomId = null;
      
      // 更新房间用户数量
      const roomUsers = await this.getRoomUsers(roomId);
      await store.updateRoomUserCount(roomId, roomUsers.length);
      
      // 通知房间内其他用户
      socket.to(roomId).emit('user-left-room', socket.user, roomId);
      
      // 通知所有用户房间列表更新
      const rooms = await this.getRoomsList();
      io.emit('rooms-updated', rooms);
      
      console.log(`用户<${socket.user.name}>离开房间<${roomId}>`);
    } catch (error) {
      console.error('离开房间失败:', error);
    }
  },

  // 关闭房间
  async closeRoom(roomId, socket) {
    try {
      const room = await store.getRoomById(roomId);
      if (!room) {
        socket.emit('close-room-failed', '房间不存在');
        return;
      }
      
      if (room.owner_id !== socket.user.id) {
        socket.emit('close-room-failed', '只有房主可以关闭房间');
        return;
      }
      
      // 更新房间状态
      await store.updateRoomStatus(roomId, false);
      
      // 获取房间内所有用户
      const roomUsers = await this.getRoomUsers(roomId);
      
      // 将所有用户踢出房间
      roomUsers.forEach(user => {
        const userSocket = io.sockets.sockets.get(user.id);
        if (userSocket) {
          userSocket.leave(roomId);
          userSocket.user.roomId = null;
          userSocket.emit('room-closed', roomId);
        }
      });
      
      // 更新房间用户数量
      await store.updateRoomUserCount(roomId, 0);
      
      // 通知所有用户房间列表更新
      const rooms = await this.getRoomsList();
      io.emit('rooms-updated', rooms);
      
      console.log(`房间<${room.name}>已关闭`);
    } catch (error) {
      console.error('关闭房间失败:', error);
      socket.emit('close-room-failed', error.message);
    }
  },
};
io.sockets.on('connection',(socket)=>{
  const token=socket.handshake.headers.token;
  let decode=null;
  if(token){
    decode=jwt.decode(token);
  }
  let user=decode?decode.data:{};
  socket.on("disconnect",(reason)=>{
          //判斷是否是已登錄用戶
    if (socket.user&&socket.user.id) {
      //刪除登錄用戶信息,並通知所有在線用戶
      socket.broadcast.emit('system', socket.user, 'logout');
      store.saveUser(socket.user,'logout')
    }
    console.log(reason)
  });
      //判斷鏈接用戶是否已經登錄
  if(user&&user.id){
    //已登錄的用戶重新登錄
    util.login(user,socket,true);
  }else {
    //監聽用戶登錄事件
    socket.on('login',(user)=>{
      util.login(user,socket,false)
    });
    
    //監聽用戶註冊事件
    socket.on('register',(user)=>{
      util.register(user,socket)
    });
  }
});
module.exports=io;
