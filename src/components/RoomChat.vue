<template>
  <div class="room-chat">
    <div class="room-header">
      <div class="room-info">
        <h2>{{ currentRoom.name }}</h2>
        <p class="room-description">{{ currentRoom.description || '無描述' }}</p>
        <div class="room-meta">
          <span class="room-owner">房主: {{ currentRoom.owner_name }}</span>
          <span class="room-users">{{ roomUsers.length }}/{{ currentRoom.max_users }}</span>
          <span class="room-status" :class="{ 'closed': !currentRoom.is_open }">
            {{ currentRoom.is_open ? '開放' : '關閉' }}
          </span>
        </div>
      </div>
      <div class="room-actions">
        <button class="logout-btn" @click="logout">
          <i class="fas fa-sign-out-alt"></i>
          登出
        </button>
        <button class="leave-room-btn" @click="leaveRoom">
          <i class="iconfont icon-exit"></i>
          離開房間
        </button>
        <button 
          v-if="isRoomOwner" 
          class="close-room-btn" 
          @click="closeRoom"
        >
          <i class="iconfont icon-close"></i>
          關閉房間
        </button>
      </div>
    </div>

    <div class="chat-container">
      <div class="chat-main">
        <div class="message-list" ref="messageList">
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            class="message-item"
            :class="{ 'own-message': message.from.id === loginUser.id }"
          >
            <div class="message-avatar">
              <img v-if="message.from.avatarUrl" :src="message.from.avatarUrl" alt="avatar">
              <i v-else class="fas fa-user-circle avatar-placeholder"></i>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-sender">{{ message.from.email || message.from.name }}</span>
                <span class="message-time">{{ formatTime(message.time) }}</span>
              </div>
                             <div class="message-text" v-if="message.type === 'text'">
                 {{ message.content }}
               </div>
               <div class="message-text welcome-message" v-else-if="message.type === 'welcome'">
                 {{ message.content }}
               </div>
               <div class="message-image" v-else-if="message.type === 'image'">
                 <img :src="message.content" alt="image" @click="previewImage(message.content)">
               </div>
            </div>
          </div>
        </div>

        <div class="message-input">
          <div class="input-container">
            <input 
              v-model="newMessage" 
              @keyup.enter="sendMessage"
              placeholder="輸入消息..."
              class="message-input-field"
            >
            <button class="send-btn" @click="sendMessage" :disabled="!newMessage.trim()">
              發送
            </button>
          </div>
        </div>
      </div>

      <div class="chat-sidebar">
        <div class="sidebar-section">
          <h3>房間用戶 ({{ roomUsers.length }})</h3>
          <div class="users-list">
            <div 
              v-for="user in roomUsers" 
              :key="user.id"
              class="user-item"
              :class="{ 'current-user': user.id === loginUser.id }"
            >
              <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="avatar" class="user-avatar">
              <i v-else class="fas fa-user-circle user-avatar-placeholder"></i>
              <div class="user-info">
                <span class="user-name">{{ user.email || user.name }}</span>
                <span class="user-device" v-if="user.deviceType">
                  <i :class="user.deviceType === 'pc' ? 'iconfont icon-pc' : 'iconfont icon-phone'"></i>
                </span>
              </div>
              <span v-if="user.id === currentRoom.owner_id" class="owner-badge">房主</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览 -->
    <div v-if="previewImageUrl" class="image-preview-overlay" @click="previewImageUrl = null">
      <div class="image-preview-content" @click.stop>
        <img :src="previewImageUrl" alt="preview">
        <button class="close-preview-btn" @click="previewImageUrl = null">×</button>
      </div>
    </div>
  </div>
</template>

<script>
import Message from './Message';

export default {
  name: 'RoomChat',
  props: {
    loginUser: {
      type: Object,
      required: true
    },
    socket: {
      type: Object,
      required: true
    },
    currentRoom: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      messages: [],
      roomUsers: [],
      newMessage: '',
      previewImageUrl: null
    };
  },
  computed: {
    isRoomOwner() {
      return this.currentRoom.owner_id === this.loginUser.id;
    }
  },
  mounted() {
    this.initSocketEvents();
    this.scrollToBottom();
  },
  updated() {
    this.scrollToBottom();
  },
  methods: {
    initSocketEvents() {
      // 房间消息历史
      this.socket.on('room-history', (roomId, messages) => {
        if (roomId === this.currentRoom.id) {
          this.messages = messages;
        }
      });

      // 新房间消息
      this.socket.on('room-message', (from, roomId, message, type) => {
        if (roomId === this.currentRoom.id) {
          this.messages.push({
            from,
            content: message,
            type,
            time: new Date().getTime()
          });
        }
      });

      // 用户加入房间
      this.socket.on('user-joined-room', (user, roomId) => {
        if (roomId === this.currentRoom.id) {
          this.addUserToRoom(user);
          // 显示欢迎消息
          this.addWelcomeMessage(user);
        }
      });

      // 用户离开房间
      this.socket.on('user-left-room', (user, roomId) => {
        if (roomId === this.currentRoom.id) {
          this.removeUserFromRoom(user.id);
          // 移除系统消息，不显示用户离开的通知
        }
      });

      // 房间被关闭
      this.socket.on('room-closed', (roomId) => {
        if (roomId === this.currentRoom.id) {
          Message.warning('房間已被關閉');
          this.$emit('room-closed', roomId);
        }
      });

      // 房间列表更新
      this.socket.on('rooms-updated', (rooms) => {
        const updatedRoom = rooms.find(room => room.id === this.currentRoom.id);
        if (updatedRoom) {
          this.$emit('room-updated', updatedRoom);
        }
      });

      // 获取房间用户列表响应
      this.socket.on('room-users-list', (roomId, users) => {
        if (roomId === this.currentRoom.id) {
          this.roomUsers = users;
        }
      });

      // 初始化房间用户列表
      this.initializeRoomUsers();
    },

    initializeRoomUsers() {
      // 添加当前用户到房间用户列表
      this.addUserToRoom(this.loginUser);
      
      // 获取房间内所有用户
      this.socket.emit('get-room-users', this.currentRoom.id);
    },

    sendMessage() {
      if (!this.newMessage.trim()) return;

      this.socket.emit('room-message', this.loginUser, this.currentRoom.id, this.newMessage.trim(), 'text');
      this.newMessage = '';
    },

    leaveRoom() {
      if (confirm('確定要離開這個房間嗎？')) {
        this.socket.emit('leave-room', this.currentRoom.id);
        this.$emit('leave-room', this.currentRoom.id);
      }
    },

    closeRoom() {
      if (confirm('確定要關閉這個房間嗎？房間內的所有用戶將被踢出。')) {
        this.socket.emit('close-room', this.currentRoom.id);
      }
    },

    logout() {
      if (confirm('確定要登出嗎？')) {
        this.$emit('logout');
      }
    },

    addUserToRoom(user) {
      const existingUser = this.roomUsers.find(u => u.id === user.id);
      if (!existingUser) {
        this.roomUsers.push(user);
      }
    },

    removeUserFromRoom(userId) {
      const index = this.roomUsers.findIndex(u => u.id === userId);
      if (index > -1) {
        this.roomUsers.splice(index, 1);
      }
    },

    addWelcomeMessage(user) {
      this.messages.push({
        from: user,
        content: `歡迎 ${user.email || user.name} 進入聊天室！`,
        type: 'welcome',
        time: new Date().getTime()
      });
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const messageList = this.$refs.messageList;
        if (messageList) {
          messageList.scrollTop = messageList.scrollHeight;
        }
      });
    },

    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    },

    previewImage(url) {
      this.previewImageUrl = url;
    }
  }
};
</script>

<style scoped>
.room-chat {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.room-info h2 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 20px;
}

.room-description {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.room-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #888;
}

.room-status {
  padding: 2px 8px;
  border-radius: 12px;
  background: #4CAF50;
  color: white;
}

.room-status.closed {
  background: #f44336;
}

.room-actions {
  display: flex;
  gap: 10px;
}

.logout-btn,
.leave-room-btn,
.close-room-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.logout-btn {
  background: #f44336;
  color: white;
}

.logout-btn:hover {
  background: #d32f2f;
}

.leave-room-btn {
  background: #ff9800;
  color: white;
}

.leave-room-btn:hover {
  background: #f57c00;
}

.close-room-btn {
  background: #f44336;
  color: white;
}

.close-room-btn:hover {
  background: #d32f2f;
}

.chat-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.message-item.own-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-avatar .avatar-placeholder {
  font-size: 24px; /* Adjust as needed */
  color: #999; /* Placeholder color */
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.message-sender {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.message-time {
  color: #999;
  font-size: 12px;
}

.message-text {
  background: #f1f1f1;
  padding: 10px 15px;
  border-radius: 18px;
  color: #333;
  word-wrap: break-word;
}

 .own-message .message-text {
   background: #4CAF50;
   color: white;
 }

 .welcome-message {
   background: #e3f2fd !important;
   color: #1976d2 !important;
   border: 1px solid #bbdefb;
   font-style: italic;
   text-align: center;
   font-weight: 500;
 }

.message-image img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-image img:hover {
  transform: scale(1.05);
}

.message-input {
  padding: 20px;
  border-top: 1px solid #eee;
  background: white;
}

.input-container {
  display: flex;
  gap: 10px;
}

.message-input-field {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
}

.message-input-field:focus {
  border-color: #4CAF50;
}

.send-btn {
  padding: 12px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.send-btn:hover:not(:disabled) {
  background: #45a049;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.chat-sidebar {
  width: 250px;
  background: white;
  border-left: 1px solid #eee;
  overflow-y: auto;
}

.sidebar-section {
  padding: 20px;
}

.sidebar-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-item:hover {
  background: #f5f5f5;
}

.user-item.current-user {
  background: #e8f5e8;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 32px;
  height: 32px;
  font-size: 32px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.user-device {
  font-size: 12px;
  color: #999;
}

.owner-badge {
  background: #ff9800;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

/* Image preview */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.image-preview-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.image-preview-content img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
}

.close-preview-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .room-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .room-actions {
    width: 100%;
    justify-content: center;
  }

  .chat-container {
    flex-direction: column;
  }

  .chat-sidebar {
    width: 100%;
    max-height: 200px;
  }

  .message-content {
    max-width: 85%;
  }
}
</style> 