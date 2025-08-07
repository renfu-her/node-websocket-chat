<template>
  <div class="user-login-warp" :class="{'iChat-user-login':type==='phone'}">
    <div class="user-login-container">
      <div class="user-login-banner" v-if="type==='pc'"></div>
      <div class="user-login-form-warp">
        <div class="user-login-form">
          <div class="form-input-warp" @mousedown.stop>
            <div class="form-group">
              <input type="email" class="form-input input-text" autocomplete="new-password" placeholder="E-mail" v-model="user.email">
            </div>
            <div class="form-group">
              <input type="password" class="form-input input-pass" autocomplete="new-password" placeholder="密碼" v-model="user.password">
            </div>
            <div class="form-group form-btn-warp">
              <button class="form-btn" type="button" @click="login">登錄</button>
              <button class="form-btn-register" type="button" @click="goToRegister">註冊</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Message from "./Message";
  export default {
    name: "UserLogin",
    props:{
      type:{
        type:String,
        default:"pc"
      }
    },
    data(){
      return {
        user:{
          name:"",
          email:"",
          password:""
        }
      }
    },
    created(){
      // 移除头像初始化代码
    },
    methods:{
      login(){
        if(this.user.email===''){
          Message.error("請輸入郵箱！");
          return
        }
        if(this.user.password===''){
          Message.error("請輸入密碼！");
          return
        }
        this.$emit("login",this.user)
      },
      goToRegister(){
        this.$emit("switch-to-register");
      }
    }
  }
</script>

<style scoped>
  .user-login-warp{
    position: fixed;
    width: 360px;
    left: 50%;
    top: 50%;
    margin-left: -180px;
    margin-top: -140px;
    box-shadow: 0 1px 3px #3a3c3e;
    border-radius: 4px;
  }
  .user-login-container{

  }
  .user-login-banner{
    background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    overflow: auto;
    height: 140px;
    border-radius: 4px 4px 0 0;
  }
  .user-login-form-warp{
    text-align: center;
    background-color: rgba(255, 255, 255, 0.95);
    padding: 20px 30px;
    border-radius: 0 0 4px 4px;
    backdrop-filter: blur(10px);
  }
  .user-login-form{
    display: inline-block;
    text-align: left;
    width: 100%;
  }
  .user-login-form:after,
  .avatar-list-warp:after{
    display: block;
    content: '';
    clear: both;
  }
  .form-input-warp{
    width: 100%;
  }
  .form-group{
    position: relative;
  }
  .form-group .form-input{
    display: block;
    width: 100%;
    height: 30px;
    outline: none;
    border: 1px solid #d1d1d1;
    margin: -1px;
    padding: 0 10px;
    font-size: 14px;
    color: #333333;
    box-sizing: border-box;
    position: relative;
  }
  .icon-random{
    display: block;
    position: absolute;
    right: 5px;
    top: 5px;
    width: 20px;
    height: 20px;
    z-index: 20;
  }
  .form-group .form-input:focus{
    border-color: #3a8ee6;
    z-index: 9;
  }
  .form-group .input-text{
    border-radius: 4px 4px 0 0;
  }
  .form-group .input-pass{
    border-radius: 0 0 4px 4px;
  }
  .form-group .form-btn{
    display: block;
    width: 100%;
    line-height: 30px;
    font-size: 14px;
    border: none;
    color: #f2f2f2;
    background-color: #3a8ee6;
    border-radius: 4px;
    outline: none;
    margin-bottom: 5px;
  }
  .form-group .form-btn-register{
    display: block;
    width: 100%;
    line-height: 30px;
    font-size: 14px;
    border: 1px solid #3a8ee6;
    color: #3a8ee6;
    background-color: #ffffff;
    border-radius: 4px;
    outline: none;
  }
  .form-group.form-btn-warp{
    margin-top: 10px;
  }
  .iChat-user-login{
    width: 300px;
    margin-left: -150px;
  }
  .iChat-user-login .user-login-form-warp{
    border-radius: 4px;
  }
</style>
