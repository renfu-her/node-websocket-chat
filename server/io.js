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
    socket.on('message',(from, to,message,type)=> {
      if(to.type==='user'){
        socket.broadcast.to(to.roomId).emit('message', socket.user, to,message,type);
      }
      if(to.type==='group'){
        socket.broadcast.emit('message', socket.user,to,message,type);
        store.saveMessage(from,to,message,type)
      }
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
    const users=[
      {
        id:"group_001",
        name:"群聊天室",
        avatarUrl:"static/img/avatar/group-icon.png",
        type:"group"
      }
    ];
    const clients=await io.fetchSockets();
    clients.forEach((item) => {
      if(item.user){
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
