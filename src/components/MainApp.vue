<template>
  <div class="main-app-warp">
    <!-- Login Component -->
    <UserLogin 
      v-if="showLogin" 
      @login="userLogin" 
      @switch-to-register="goToRegister" 
      :type="deviceType" 
      v-drag
    ></UserLogin>
    
    <!-- Register Component -->
    <UserRegister 
      v-if="showRegister" 
      @register-success="userLogin" 
      @switch-to-login="goToLogin" 
      :type="deviceType" 
      v-drag
    ></UserRegister>
    
    <!-- Lobby Component -->
    <RoomLobby 
      v-if="showLobby && deviceType==='pc'" 
      :loginUser="loginUser" 
      :socket="socket"
      @join-room="joinRoom"
      @room-created="onRoomCreated"
      @room-closed="onRoomClosed"
      @logout="logout"
      v-drag
    ></RoomLobby>
    
    <!-- Mobile Lobby Component -->
    <RoomLobby 
      v-if="showLobby && deviceType==='phone'" 
      :loginUser="loginUser" 
      :socket="socket"
      @join-room="joinRoom"
      @room-created="onRoomCreated"
      @room-closed="onRoomClosed"
      @logout="logout"
    ></RoomLobby>
    
    <!-- Room Chat Component -->
    <RoomChat 
      v-if="showRoom && deviceType==='pc'" 
      :loginUser="loginUser" 
      :socket="socket"
      :currentRoom="currentRoom"
      @leave-room="leaveRoom"
      @room-closed="onRoomClosed"
      @room-updated="onRoomUpdated"
      @logout="logout"
    ></RoomChat>
    
    <!-- Mobile Room Chat Component -->
    <RoomChat 
      v-if="showRoom && deviceType==='phone'" 
      :loginUser="loginUser" 
      :socket="socket"
      :currentRoom="currentRoom"
      @leave-room="leaveRoom"
      @room-closed="onRoomClosed"
      @room-updated="onRoomUpdated"
      @logout="logout"
    ></RoomChat>

    <audio :src="audioSrc" ref="audio"></audio>
  </div>
</template>

<script>
import UserLogin from "./UserLogin";
import UserRegister from "./UserRegister";
import RoomLobby from "./RoomLobby";
import RoomChat from "./RoomChat";
import {getDeviceType} from "./emoji";
import Message from "./Message";
import { Manager } from 'socket.io-client';
import {friendlyTime,formatTime} from './filters'
import { BELL_URL } from "./config";

export default {
  name: "main-app",
  components:{
    UserLogin,
    UserRegister,
    RoomLobby,
    RoomChat
  },
  filters:{
    friendlyTime,
    formatTime
  },
  computed:{
    isLoggedIn() {
      return this.loginUser && this.loginUser.id;
    },
    currentRoute() {
      return this.$route.name;
    },
    showLogin() {
      return this.currentRoute === 'Login' && !this.isLoggedIn;
    },
    showRegister() {
      return this.currentRoute === 'Register' && !this.isLoggedIn;
    },
    showLobby() {
      return this.isLoggedIn && !this.currentRoom && (this.currentRoute === 'Lobby' || this.currentRoute === 'Login' || this.currentRoute === 'Register');
    },
    showRoom() {
      return this.isLoggedIn && this.currentRoom && this.currentRoute === 'Room';
    },
    finallyMessage(){
      return (sessionId) => {
        let messages=[];
        if(sessionId&&this.messageData[sessionId]){
          messages= this.messageData[sessionId];
        }
        const len=messages.length;
        if(len>0){
          return messages[len-1];
        }else {
          return {}
        }
      }
    },
    unReadNum(){
      return (sessionId) => {
        let messages=[];
        if(sessionId&&this.messageData[sessionId]){
          messages= this.messageData[sessionId];
        }
        let num=0;
        messages.forEach((item) => {
          if(!item.isRead){
            num++;
          }
        });
        return num;
      }
    }
  },
  data(){
    const type=getDeviceType(window.navigator.userAgent);
    return {
      appTitle:document.title,
      menus:[
        {
          name:"chat",
          icon:"iconfont icon-comments",
          title:"会话"
        },
        {
          name:"setting",
          icon:"iconfont icon-cog",
          title:"设置"
        },
        {
          name:"about",
          icon:"iconfont icon-info",
          title:"关于"
        },
      ],
      curMenu:"chat",
      users:[],
      curSession:{},
      keyword:"",
      messageData:{},
      setting:{
        isName: true,
        isTime:true,
        isVoice:true
      },
      about:{
        version:"v1.0",
        license:"MIT",
        author:"cleverqin",
        email:"705597001@qq.com",
        github:"https://github.com/cleverqin/node-websocket-Chatroom"
      },
      loginUser:{},
      token:"",
      deviceType:type,
      audioSrc:BELL_URL,
      socketURL:window._HOST||'',
      socket:null,
      isConnect:false,
      currentRoom:null
    }
  },
  mounted(){
    this.initSocket();
    this.checkAuth();
    this.handleRouteChange();
  },
  watch: {
    '$route'() {
      this.handleRouteChange();
    }
  },
      methods:{
      handleRouteChange() {
        // Handle room route parameter
        if (this.$route.name === 'Room' && this.$route.params.roomId) {
          const roomId = this.$route.params.roomId;
          // If we don't have a current room or the room ID doesn't match, we need to fetch the room
          if (!this.currentRoom || this.currentRoom.id !== roomId) {
            // For now, we'll create a basic room object
            // In a real application, you'd fetch the room data from the server
            this.currentRoom = {
              id: roomId,
              name: `Room ${roomId}`,
              // Add other room properties as needed
            };
          }
        } else if (this.$route.name === 'Lobby') {
          // Clear current room when going to lobby
          this.currentRoom = null;
        }
      },
      checkAuth() {
      // Check if user is already logged in from localStorage/sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (token && userData) {
        try {
          this.token = token;
          this.loginUser = JSON.parse(userData);
          // Reconnect socket if needed
          if (!this.socket) {
            this.initSocket();
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
          this.clearAuth();
        }
      }
    },
    
    clearAuth() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      this.loginUser = {};
      this.token = "";
      this.currentRoom = null;
      this.curSession = {};
      this.users = [];
    },
    
    goToLogin() {
      this.showRegister = false;
      this.$router.push('/login');
    },
    
    goToRegister() {
      this.showRegister = true;
      this.$router.push('/register');
    },
    
    searchUser(keyword){
      let arr=[];
      this.users.forEach( (item )=>{
        if((item.name.indexOf(keyword)!==-1)||(item.id.indexOf(keyword)!==-1)){
          arr.push(item)
        }
      });
      return arr;
    },
    getMessages(sessionId){
      if(sessionId&&this.messageData[sessionId]){
        return this.messageData[sessionId];
      }
      return []
    },
    addSessionMessage(message,sessionId){
      const vm=this;
      if(!this.messageData[sessionId]){
        this.$set(this.messageData,sessionId,[]);
      }
      this.messageData[sessionId].push(message);
      if(this.curSession.id===sessionId){
        setTimeout(()=>{
          vm.scrollFooter('message-list')
        },16)
      }
      const {from,to}=message;
      if(this.setting.isVoice&&this.curSession.id!==from.id&&from.id!==this.loginUser.id&&to.type==='user'){
        this.playAudio();
      }
    },
    sendMessage(content,type,session){
      const message={
        from:this.loginUser,
        to:session,
        content:content,
        type:type,
        time:new Date().getTime(),
        isRead:true
      };
      this.addSessionMessage(message,session.id);
      if(this.socket){
        this.socket.emit("message",message.from,message.to,message.content,message.type)
      }
    },
    setSessionRead(sessionId){
      let messages=this.getMessages(sessionId);
      if(messages.length===0){
        return
      }
      messages.forEach((item)=>{
        if(!item.isRead){
          item.isRead=true;
        }
      })
    },
    scrollFooter(name){
      let $el=this.$refs[name];
      if($el){
        this.$nextTick(()=>{
          $el.scrollTop = $el.scrollHeight
        })
      }
    },
    changeSession(session){
      const vm=this;
      if(session.id===this.curSession.id){
        return
      }
      this.setSessionRead(session.id);
      this.curSession=session;
      setTimeout(()=>{
        vm.scrollFooter('message-list')
      },16)
      if(session.name){
        document.title='与'+session.name+"聊天中|"+this.appTitle
      }else {
        document.title=this.loginUser.email || this.loginUser.name+"|"+this.appTitle
      }
    },
    userLogin(user){
      if (!this.socket){
        user.time=new Date().getTime()
        this.loginUser=user;
      }else {
        this.socket.emit('login',user)
      }
    },
    playAudio() {
      const $audio=this.$refs['audio'];
      if($audio){
        $audio.play();
      }
    },
    initSocket(){
      let _this=this;
      const manager = new Manager(this.socketURL);
      const socket = manager.socket("/");
      _this.socket=socket;
      _this.socket.on("error",()=>{
        console.log("出错了！！")
      })
      _this.socket.on("disconnect",(reason)=>{
        this.isConnect=false;
        console.log(reason+ ' - disconnect');
      })
      _this.socket.io.on("reconnect_attempt",(attempt)=>{
        console.info("重新尝试链接！！",attempt)
        _this.socket.io.opts.extraHeaders={
          token:_this.token
        }
      });
      _this.socket.io.on("reconnect_failed",()=>{
        console.warn('重新链接失败！')
      });
      _this.socket.io.on("reconnect",()=>{
        console.info('重新链接成功！')
      });
      _this.socket.on("connect",(data)=>{
        this.isConnect=true;
        console.log("链接成功！",data)
      })
      _this.socket.on("loginSuccess",_this.loginSuccess);
      _this.socket.on("loginFail",_this.loginFail);
      _this.socket.on("message",_this.listenerMessage);
      _this.socket.on("system",_this.listenerSystem);
      _this.socket.on("history-message",_this.listenerHistoryMessage);
    },
    addUser(user){
      let index=-1;
      for (let i = 0; i < this.users.length; i++) {
        let item = this.users[i];
        if(user.id===item.id){
          index=i;
          this.users[i]=user;
        }
      }
      if(index===-1){
        this.users.push(user);
      }
    },
    loginSuccess(data,users){
      const _this=this;
      _this.loginUser=data.user;
      _this.token=data.token;
      _this.users=users;
      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Reset room state on login
      _this.currentRoom = null;
      _this.curSession = {};
      // Navigate to lobby
      this.$router.push('/lobby');
    },
    loginFail(message){
      Message.error(message);
    },
    listenerMessage(from,to,message,type){
      const _this=this;
      let isRead=false;
      if(to.type==='group'){
        if(_this.curSession.id===to.id){
          isRead=true;
        }
      }else {
        if(_this.curSession.id===from.id){
          isRead=true;
        }
      }
      let MESSAGE={
        from:from,
        to:to,
        content:message,
        time:new Date().getTime(),
        type:type,
        isRead
      };
      this.addSessionMessage(MESSAGE,to.type==='group'?to.id:from.id)
    },
    listenerSystem(user,type){
      const _this=this;
      switch (type) {
        case "join":
          _this.addUser(user);
          break;
        case "logout":
          _this.removeUser(user);
          break;
        default:
          return;
      }
    },
    listenerHistoryMessage(channelId,msgList){
      const _this=this;
      _this.$set(_this.messageData,channelId,msgList)
    },
    removeUser(user){
      for (let i = 0; i < this.users.length; i++) {
        let item = this.users[i];
        if(user.id===item.id){
          this.users.splice(i,1);
          if(item.id===this.curSession.id){
            this.curSession={};
          }
          break;
        }
      }
    },

    // Room-related methods
    joinRoom(room) {
      this.currentRoom = room;
      this.$router.push(`/room/${room.id}`);
    },

    leaveRoom() {
      this.currentRoom = null;
      this.curSession = {};
      this.$router.push('/lobby');
    },

    onRoomCreated(room) {
      // Optionally join the room immediately after creation
      this.currentRoom = room;
      this.$router.push(`/room/${room.id}`);
    },

    onRoomClosed() {
      this.currentRoom = null;
      this.curSession = {};
      this.$router.push('/lobby');
    },

    onRoomUpdated(updatedRoom) {
      if (this.currentRoom && this.currentRoom.id === updatedRoom.id) {
        this.currentRoom = updatedRoom;
      }
    },

    logout() {
      this.clearAuth();
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      Message.success("已登出");
      this.$router.push('/login');
    }
  },
  beforeDestroy(){
    if(this.socket){
      this.socket.close()
    }
  }
}
</script>

<style scoped lang="less">
  .main-app-warp{
    width: 100%;
    height: 100%;
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
  }
  
  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  .ui-clear:after{
    display: block;
    content: '';
    clear: both;
  }
  .app-main-panel{
    width: 700px;
    height: 600px;
    background-color: #f2f2f2;
    position: absolute;
    left: 50%;
    top: 50%;
    margin-left: -350px;
    margin-top: -300px;
  }
  .app-aside-panel{
    width: 60px;
    position: relative;
    height: 100%;
    float: left;
    background-color: #333333;
  }
  .app-user-avatar{
    padding: 10px;
  }
  .app-user-avatar img{
    width:40px;
    height: 40px;
    border-radius: 4px;
  }
  .aside-menu-list{
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .aside-menu-list li{
    line-height: 40px;
    height: 40px;
    text-align: center;
    cursor: pointer;
  }
  .aside-menu-list li span{
    font-size: 22px;
    color: #f2f2f2;
  }
  .aside-menu-list li:hover span,
  .aside-menu-list li.active span{
    color: #b2e281;
  }
  .app-container{
    height: 100%;
    margin-left:60px;
  }
  .app-container-panel{
    position: relative;
    width: 100%;
    height: 100%;
  }
  .app-user-panel{
    width: 220px;
    height: 100%;
    position: relative;
    border-right: 1px solid #d1d1d1;
    background-color: #fcfcfc;
    box-sizing: border-box;
    float: left;
  }
  .app-users-warp{
    height: calc(100% - 60px);
    overflow-y: auto;
  }
  .app-user-item{
    cursor: pointer;
  }
  .app-user-item:hover{
    background-color: #f2f2f2;
  }
  .app-user-item.active{
    background-color: #ededed;
  }
  .app-session-panel{
    margin-left: 220px;
    height: 100%;
  }
  .app-warp{
    margin: 0 auto;
  }
  .message-list-warp{
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    padding: 10px;
    overflow-y: auto;
  }
  .message-item:first-child{
    margin-top: 0;
  }
  .message-item{
    margin-top: 10px;
  }
  .app-user-form{
    height: 50px;
    box-sizing: border-box;
    padding: 10px;
    position: relative;
  }
  .app-form-icon{
    position: absolute;
    top: 10px;
    font-size: 18px;
    margin-left: 5px;
    height: 30px;
    color: #606266;
    line-height: 30px;
  }
  .app-form-element{
    height: 30px;
    font-size: 14px;
    width: 100%;
    box-sizing: border-box;
    padding: 8px 10px 8px 25px;
    border-radius: 15px;
    outline: none;
    border: none;
    background-color: #ebeef0;
    color: #666666;
  }
  .app-no-session{
    position: relative;
    width: 100%;
    height: 100%;
  }
  .app-no-session span.iconfont{
    position: absolute;
    display: block;
    width: 100px;
    height: 100px;
    top: 50%;
    left: 50%;
    text-align: center;
    line-height: 100px;
    vertical-align: middle;
    margin-top: -50px;
    margin-left: -50px;
    font-size: 100px;
    color: #e7e7e7;
  }
  .app-user-num{
    font-size: 12px;
    color: #666666;
  }
  .app-use-extInfo i.iconfont{
    display: inline-block;
    font-size: 18px;
    color: #0e8307;
    line-height: 30px;
    margin-right: 5px;
    position: relative;
    top: 2px;
  }
  .app-use-extInfo span{
    font-size: 12px;
    color: #666666;
  }
  .app-card-title{
    font-size: 16px;
    line-height: 40px;
    color: #333333;
    padding: 0 10px;
  }
  .app-user-card{
    padding: 10px;
    height: 60px;
  }
  .app-card-avatar{
    float: left;
    width: 60px;
    height: 60px;
    border-radius: 4px;
  }
  .app-card-avatar img{
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 4px;
  }
  .app-card-container{
    margin-left: 70px;
    height: 60px;
  }
  .app-card-infoRow{
    line-height: 20px;
    height: 20px;
  }
  .app-card-infoRow i.iconfont{
    font-size: 16px;
    color: #0e8307;
  }
  .app-login-ip{
    font-size: 14px;
    color: #666666;
    margin-left: 5px;
  }
  .app-login-time{
    font-size: 14px;
    color: #666666;
  }
  .app-setting{
    max-width: 400px;
  }
  .ui-list{
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .ui-list li{
    line-height: 20px;
    height: 40px;
    border-bottom: 1px solid #d9dce0;
    padding: 10px;
    margin: 0 10px;
    box-sizing: border-box;
  }
  .ui-list li .ui-label{
    font-size: 14px;
    color: #333333;
  }
  .ui-right{
    float: right;
  }
  .ui-text{
    font-size: 14px;
    color: #666666;
  }
  .ui-link{
    font-size: 14px;
    color: #4792ff;
    text-decoration: none;
    margin-right: 5px;
  }
  /*定义滚动条宽高及背景，宽高分别对应横竖滚动条的尺寸*/
  .scroll::-webkit-scrollbar{
    width: 5px;
    height: 5px;
    background-color: rgba(255, 255, 255, 0.13);
  }
  /*定义滚动条的轨道，内阴影及圆角*/
  .scroll::-webkit-scrollbar-track{
    -webkit-box-shadow: inset 0 0 6px rgba(240, 240, 240, 0);
    border-radius: 10px;
    background-color: rgba(0, 89, 255, 0);
  }
  /*定义滑块，内阴影及圆角*/
  .scroll::-webkit-scrollbar-thumb{
    /*width: 10px;*/
    height: 20px;
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(236, 236, 236, 0.3);
    background-color: rgba(203, 203, 203, 0.54);
    transition: all 0.5s;
  }
</style>
<style scoped lang="less">
  .app-main-touch{
    display: block;
    max-width:640px;
    height: 100%;
    position: relative;
    background-color: transparent;
    margin: 0 auto;
    overflow-x: hidden;
  }
  .app-iChat-container{
    height: calc(100% - 61px);
    width: 100%;
    position: relative;
  }
  .app-iChat-menus{
    list-style: none;
    padding: 0;
    margin: 0;
    background-color: rgba(255, 255, 255, 0.9);
    border-top: 1px solid #d1d1d1;
    backdrop-filter: blur(10px);
  }
  .iChat-menu-item{
    float: left;
    width: 33.3333333%;
    text-align: center;
    color: #666666;
    height: 60px;
    padding: 6px 0;
    box-sizing: border-box;
  }
  .iChat-menu-item.active{
    color: #3a8ee6;
  }
  .iChat-menu-icon span.iconfont{
    font-size: 25px;
  }
  .iChat-menu-name{
    font-size: 14px;
  }
  .app-iChat-panel{
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }
  .iChat-search-warp{
    height: 60px;
    background-color: #3a8ee6;
    padding: 10px;
    box-sizing: border-box;
  }
  .iChat-user-avatar{
    display: block;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    float: left;
  }
  .iChat-user-avatar img{
    display: block;
    width: 100%;
    height: 100%;
    border-radius:50px;
  }
  .iChat-element{
    margin-left: 50px;
    position: relative;
  }
  .iChat-element span.iconfont{
    display: block;
    position: absolute;
    left: 0;
    font-size: 16px;
    line-height: 40px;
    height: 40px;
    width: 30px;
    text-align: center;
    color: #ddd;
  }
  .iChat-search-input{
    display: block;
    width: 100%;
    line-height: 20px;
    padding: 10px 10px 10px 30px;
    height: 40px;
    outline: none;
    font-size: 14px;
    color: #f2f2f2;
    box-sizing: border-box;
    border-radius: 4px;
    border: none;
    background: rgba(0,0,0,.11);
  }
  .iChat-search-input::-webkit-input-placeholder{
    color: #ddd;
  }
  .iChat-users-warp{
    height: calc(100% - 60px);
    width: 100%;
    overflow-y: auto;
  }
  .iChat-user-item{
    border-bottom: 1px solid #f2f2f2;
  }
  .iChat-setting-cover{
    height: 160px;
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
  }
  .iChat-setting-cover img{
    width: 80px;
    height: 80px;
    border-radius: 50%;
    position: absolute;
    border: 4px solid #ffffff;
    left: 50%;
    margin-left: -40px;
    bottom: 0;
    margin-bottom: -20px;
    box-sizing: border-box;
  }
  .app-iChat-panel .app-setting{
    width: 100%;
    max-width: 100%;
  }
  .app-iChat-panel .ui-right{
    font-size: 14px;
    color: #666666;
  }
  .app-iChat-panel .ui-right i.iconfont{
    color: #097603;
  }
  .iChat-message-warp{
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }
  .iChat-message-list{
    padding: 10px;
  }
  .icon-09{
    display: block;
    position: absolute;
    right: 5px;
    top: 5px;
    width: 40px;
    height: 40px;
    font-size: 20px;
    color: #e64b15;
    font-weight: 500;
    text-align: center;
    line-height: 40px;
    z-index: 9999;
    animation: shake 2s linear infinite alternate;
  }
  @keyframes shake {
    0%{
      opacity: 0.2;
    }
    100%{
      opacity: 1;
    }
  }
</style>
