<template>
  <div class="user-profile-container">
    <div class="profile-panel">
      <div class="profile-header">
        <h2>個人資料</h2>
        <button class="back-btn" @click="goBack">
          <i class="fas fa-arrow-left"></i> 返回
        </button>
      </div>
      
      <div class="profile-content">
        <div class="avatar-section">
          <div class="avatar-container">
            <img 
              v-if="user.avatarUrl && user.avatarUrl !== ''" 
              :src="user.avatarUrl" 
              alt="Avatar" 
              class="user-avatar"
            />
            <i v-else class="fas fa-user-circle user-avatar-placeholder"></i>
          </div>
          <div class="avatar-actions">
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileChange" 
              accept="image/*" 
              style="display: none;"
            />
            <button class="change-avatar-btn" @click="selectFile">
              <i class="fas fa-camera"></i> 更換頭像
            </button>
            <button v-if="user.avatarUrl" class="remove-avatar-btn" @click="removeAvatar">
              <i class="fas fa-trash"></i> 移除頭像
            </button>
          </div>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label for="name">用戶名</label>
            <input 
              type="text" 
              id="name" 
              v-model="user.name" 
              placeholder="輸入用戶名"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="email">電子郵件</label>
            <input 
              type="email" 
              id="email" 
              v-model="user.email" 
              placeholder="輸入電子郵件"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="password">密碼 (留空則不更改)</label>
            <input 
              type="password" 
              id="password" 
              v-model="user.password" 
              placeholder="輸入新密碼"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">確認密碼</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              placeholder="再次輸入新密碼"
              class="form-input"
            />
          </div>

          <div class="form-actions">
            <button class="save-btn" @click="saveProfile" :disabled="saving">
              <i class="fas fa-save"></i> {{ saving ? '保存中...' : '保存' }}
            </button>
            <button class="cancel-btn" @click="goBack">
              <i class="fas fa-times"></i> 取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserProfile',
  props: {
    loginUser: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      user: {},
      confirmPassword: '',
      saving: false
    }
  },
  mounted() {
    // Copy user data to avoid direct mutation
    this.user = { ...this.loginUser };
  },
  methods: {
    selectFile() {
      this.$refs.fileInput.click();
    },
    
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('請選擇圖片文件');
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('圖片大小不能超過5MB');
          return;
        }
        
        this.uploadImage(file);
      }
    },
    
    async uploadImage(file) {
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('userId', this.user.id);
        
        const response = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          this.user.avatarUrl = result.avatarUrl;
          // Emit event to update parent component
          this.$emit('profile-updated', this.user);
        } else {
          throw new Error('上傳失敗');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('上傳頭像失敗，請重試');
      }
    },
    
    removeAvatar() {
      this.user.avatarUrl = '';
    },
    
    async saveProfile() {
      if (!this.user.name || this.user.name.trim() === '') {
        alert('請輸入用戶名');
        return;
      }
      
      if (!this.user.email || this.user.email.trim() === '') {
        alert('請輸入電子郵件');
        return;
      }
      
      // 驗證密碼
      if (this.user.password && this.user.password.trim() !== '') {
        if (this.user.password.length < 6) {
          alert('密碼長度至少需要6位');
          return;
        }
        
        if (this.user.password !== this.confirmPassword) {
          alert('兩次輸入的密碼不一致');
          return;
        }
      }
      
      this.saving = true;
      
      try {
        const updateData = {
          name: this.user.name,
          email: this.user.email,
          image: this.user.avatarUrl || ''
        };
        
        // 只有在填寫密碼時才包含密碼
        if (this.user.password && this.user.password.trim() !== '') {
          updateData.password = this.user.password;
        }
        
        const response = await fetch('/api/update-profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          const result = await response.json();
          // Update local storage
          localStorage.setItem('user', JSON.stringify(result.user));
          // Emit event to update parent component
          this.$emit('profile-updated', result.user);
          alert('資料更新成功');
          this.goBack();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || '更新失敗');
        }
      } catch (error) {
        console.error('Save error:', error);
        alert('保存失敗：' + error.message);
      } finally {
        this.saving = false;
      }
    },
    
    goBack() {
      this.$router.go(-1);
    }
  }
}
</script>

<style scoped>
.user-profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.profile-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 30px;
  max-width: 500px;
  width: 100%;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.profile-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.back-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.back-btn:hover {
  background: #5a6268;
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.avatar-container {
  margin-bottom: 20px;
}

.user-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.user-avatar-placeholder {
  font-size: 120px;
  color: #6c757d;
  border: 4px solid #fff;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.avatar-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.change-avatar-btn, .remove-avatar-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.change-avatar-btn {
  background: #007bff;
  color: white;
}

.change-avatar-btn:hover {
  background: #0056b3;
}

.remove-avatar-btn {
  background: #dc3545;
  color: white;
}

.remove-avatar-btn:hover {
  background: #c82333;
}

.form-section {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.save-btn, .cancel-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

.save-btn {
  background: #28a745;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #218838;
}

.save-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
}

@media (max-width: 768px) {
  .profile-panel {
    margin: 10px;
    padding: 20px;
  }
  
  .avatar-actions {
    flex-direction: column;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>
