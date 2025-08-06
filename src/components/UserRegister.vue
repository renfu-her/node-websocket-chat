<template>
  <div class="user-register-warp" v-drag>
    <div class="register-panel">
      <div class="register-header">
        <div class="register-avatar">
          <img :src="user.avatarUrl" alt="">
        </div>
        <div class="register-title">用户注册</div>
      </div>
      <div class="register-form">
        <div class="form-group">
          <label>用户名</label>
          <input 
            type="text" 
            v-model="user.name" 
            placeholder="请输入用户名"
            @keyup.enter="register"
          >
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input 
            type="email" 
            v-model="user.email" 
            placeholder="请输入邮箱"
            @keyup.enter="register"
          >
        </div>
        <div class="form-group">
          <label>密码</label>
          <input 
            type="password" 
            v-model="user.password" 
            placeholder="请输入密码"
            @keyup.enter="register"
          >
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input 
            type="password" 
            v-model="confirmPassword" 
            placeholder="请再次输入密码"
            @keyup.enter="register"
          >
        </div>
        <div class="form-actions">
          <button class="btn-register" @click="register" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
          <button class="btn-login" @click="goToLogin">
            已有账号？去登录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserRegister',
  props: {
    type: {
      type: String,
      default: 'pc'
    }
  },
  data() {
    return {
      user: {
        name: '',
        email: '',
        password: '',
        avatarUrl: this.getRandomAvatar()
      },
      confirmPassword: '',
      loading: false
    }
  },
  methods: {
    getRandomAvatar() {
      const avatars = [
        'static/img/avatar/20180414165754.jpg',
        'static/img/avatar/20180414165815.jpg',
        'static/img/avatar/20180414165821.jpg',
        'static/img/avatar/20180414165827.jpg',
        'static/img/avatar/20180414165834.jpg',
        'static/img/avatar/20180414165846.jpg',
        'static/img/avatar/20180414165855.jpg',
        'static/img/avatar/20180414165909.jpg',
        'static/img/avatar/20180414165914.jpg',
        'static/img/avatar/20180414165920.jpg',
        'static/img/avatar/20180414165927.jpg',
        'static/img/avatar/20180414165936.jpg',
        'static/img/avatar/20180414165942.jpg',
        'static/img/avatar/20180414165947.jpg',
        'static/img/avatar/20180414165955.jpg',
        'static/img/avatar/20180414170003.jpg'
      ];
      return avatars[Math.floor(Math.random() * avatars.length)];
    },
    validateForm() {
      if (!this.user.name.trim()) {
        this.$message.error('请输入用户名');
        return false;
      }
      if (!this.user.email.trim()) {
        this.$message.error('请输入邮箱');
        return false;
      }
      if (!this.validateEmail(this.user.email)) {
        this.$message.error('请输入有效的邮箱地址');
        return false;
      }
      if (!this.user.password) {
        this.$message.error('请输入密码');
        return false;
      }
      if (this.user.password.length < 6) {
        this.$message.error('密码长度至少6位');
        return false;
      }
      if (this.user.password !== this.confirmPassword) {
        this.$message.error('两次输入的密码不一致');
        return false;
      }
      return true;
    },
    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    async register() {
      if (!this.validateForm()) {
        return;
      }

      this.loading = true;
      try {
        this.$socket.emit('register', this.user);
      } catch (error) {
        this.$message.error('注册失败: ' + error.message);
        this.loading = false;
      }
    },
    goToLogin() {
      this.$emit('switch-to-login');
    }
  },
  mounted() {
    // 监听注册结果
    this.$socket.on('registerFail', (message) => {
      this.$message.error(message);
      this.loading = false;
    });

    this.$socket.on('loginSuccess', (data) => {
      this.$message.success('注册成功！');
      this.$emit('register-success', data.user);
      this.loading = false;
    });
  },
  beforeDestroy() {
    this.$socket.off('registerFail');
    this.$socket.off('loginSuccess');
  }
}
</script>

<style scoped lang="less">
.user-register-warp {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.register-panel {
  background: white;
  border-radius: 10px;
  padding: 30px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  border-radius: 50%;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.register-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.register-form {
  .form-group {
    margin-bottom: 20px;
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #555;
    }
    
    input {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e1e5e9;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.3s;
      
      &:focus {
        outline: none;
        border-color: #007bff;
      }
      
      &::placeholder {
        color: #999;
      }
    }
  }
}

.form-actions {
  margin-top: 30px;
  
  button {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .btn-register {
    background: #007bff;
    color: white;
    margin-bottom: 10px;
    
    &:hover:not(:disabled) {
      background: #0056b3;
    }
  }
  
  .btn-login {
    background: #f8f9fa;
    color: #007bff;
    border: 1px solid #007bff;
    
    &:hover {
      background: #e9ecef;
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .register-panel {
    width: 90vw;
    padding: 20px;
  }
  
  .register-title {
    font-size: 20px;
  }
}
</style> 