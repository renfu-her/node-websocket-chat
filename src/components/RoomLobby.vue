<template>
  <div class="room-lobby">
    <div class="lobby-header">
      <h2>房間大廳</h2>
      <div class="user-info">
        <img v-if="loginUser.avatarUrl" :src="loginUser.avatarUrl" alt="avatar" class="user-avatar">
        <i v-else class="fas fa-user-circle user-avatar-placeholder"></i>
        <span class="user-name">{{ loginUser.email || loginUser.name }}</span>
        <button class="profile-btn" @click="goToProfile">
          <i class="fas fa-user-edit"></i>
          個人資料
        </button>
        <button class="logout-btn" @click="logout">
          <i class="fas fa-sign-out-alt"></i>
          登出
        </button>
      </div>
    </div>

    <div class="lobby-content">
      <div class="create-room-section">
        <button class="create-room-btn" @click="showCreateRoom = true">
          <i class="iconfont icon-plus"></i>
          創建房間
        </button>
      </div>

      <div class="rooms-section">
        <h3>可用房間</h3>
        <div class="rooms-list">
          <div 
            v-for="room in rooms" 
            :key="room.id" 
            class="room-item"
            :class="{ 'room-closed': !room.is_open }"
          >
            <div class="room-info">
              <div class="room-name">{{ room.name }}</div>
              <div class="room-description">{{ room.description || '無描述' }}</div>
              <div class="room-meta">
                <span class="room-owner">房主: {{ room.owner_name }}</span>
                <span class="room-users">{{ room.current_users }}/{{ room.max_users }}</span>
                <span class="room-status" :class="{ 'closed': !room.is_open }">
                  {{ room.is_open ? '開放' : '關閉' }}
                </span>
              </div>
            </div>
            <div class="room-actions">
              <button 
                v-if="room.is_open" 
                class="join-room-btn" 
                @click="joinRoom(room.id)"
                :disabled="room.current_users >= room.max_users"
              >
                加入房間
              </button>
              <button 
                v-if="room.owner_id === loginUser.id && room.is_open" 
                class="close-room-btn" 
                @click="closeRoom(room.id)"
              >
                關閉房間
              </button>
              <span v-if="!room.is_open" class="room-closed-text">房間已關閉</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建房间弹窗 -->
    <div v-if="showCreateRoom" class="modal-overlay" @click="showCreateRoom = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>創建房間</h3>
          <button class="close-btn" @click="showCreateRoom = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>房間名稱</label>
            <input 
              v-model="newRoom.name" 
              type="text" 
              placeholder="輸入房間名稱"
              maxlength="20"
            >
          </div>
          <div class="form-group">
            <label>房間描述</label>
            <textarea 
              v-model="newRoom.description" 
              placeholder="輸入房間描述（可選）"
              maxlength="100"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label>最大人數</label>
            <input 
              v-model.number="newRoom.max_users" 
              type="number" 
              min="2" 
              max="100"
              placeholder="50"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showCreateRoom = false">取消</button>
          <button class="confirm-btn" @click="createRoom" :disabled="!newRoom.name">
            創建房間
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Message from './Message';

export default {
  name: 'RoomLobby',
  props: {
    loginUser: {
      type: Object,
      required: true
    },
    socket: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      rooms: [],
      showCreateRoom: false,
      newRoom: {
        name: '',
        description: '',
        max_users: 50
      }
    };
  },
  mounted() {
    this.initSocketEvents();
    this.getRooms();
  },
  methods: {
    initSocketEvents() {
      // 获取房间列表
      this.socket.on('rooms-list', (rooms) => {
        this.rooms = rooms;
      });

      // 房间列表更新
      this.socket.on('rooms-updated', (rooms) => {
        this.rooms = rooms;
      });

      // 房间创建成功
      this.socket.on('room-created', (room) => {
        this.showCreateRoom = false;
        this.newRoom = { name: '', description: '', max_users: 50 };
        Message.success('房間創建成功！');
        this.$emit('room-created', room);
      });

      // 房间创建失败
      this.socket.on('room-create-failed', (error) => {
        Message.error(`創建房間失敗: ${error}`);
      });

      // 加入房间失败
      this.socket.on('join-room-failed', (error) => {
        Message.error(`加入房間失敗: ${error}`);
      });

      // 房间被关闭
      this.socket.on('room-closed', (roomId) => {
        Message.warning('房間已被關閉');
        this.$emit('room-closed', roomId);
      });

      // 关闭房间失败
      this.socket.on('close-room-failed', (error) => {
        Message.error(`關閉房間失敗: ${error}`);
      });
    },

    getRooms() {
      this.socket.emit('get-rooms');
    },

    createRoom() {
      if (!this.newRoom.name.trim()) {
        Message.error('請輸入房間名稱');
        return;
      }

      const roomData = {
        id: 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: this.newRoom.name.trim(),
        description: this.newRoom.description.trim(),
        max_users: this.newRoom.max_users
      };

      this.socket.emit('create-room', roomData);
    },

    joinRoom(roomId) {
      this.socket.emit('join-room', roomId);
      // Find the room data and emit it
      const room = this.rooms.find(r => r.id === roomId);
      if (room) {
        this.$emit('join-room', room);
      }
    },

    closeRoom(roomId) {
      if (confirm('確定要關閉這個房間嗎？房間內的所有用戶將被踢出。')) {
        this.socket.emit('close-room', roomId);
      }
    },

    logout() {
      this.$emit('logout');
    },

    goToProfile() {
      this.$router.push('/profile');
    }
  }
};
</script>

<style scoped>
.room-lobby {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.lobby-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  font-size: 24px;
  color: #888;
}

.user-name {
  font-weight: 500;
  color: #666;
}

.profile-btn {
  background: none;
  border: none;
  color: #2196F3;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.profile-btn:hover {
  color: #1976D2;
}

.logout-btn {
  background: none;
  border: none;
  color: #f44336;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.logout-btn:hover {
  color: #d32f2f;
}

.lobby-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.create-room-section {
  text-align: center;
}

.create-room-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.create-room-btn:hover {
  background: #45a049;
}

.rooms-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.rooms-list {
  display: grid;
  gap: 15px;
}

.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
}

.room-item:hover {
  border-color: #4CAF50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

.room-item.room-closed {
  opacity: 0.6;
  background: #f5f5f5;
}

.room-info {
  flex: 1;
}

.room-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.room-description {
  color: #666;
  margin-bottom: 10px;
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

.join-room-btn, .close-room-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.join-room-btn {
  background: #2196F3;
  color: white;
}

.join-room-btn:hover:not(:disabled) {
  background: #1976D2;
}

.join-room-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.close-room-btn {
  background: #f44336;
  color: white;
}

.close-room-btn:hover {
  background: #d32f2f;
}

.room-closed-text {
  color: #f44336;
  font-size: 14px;
  font-weight: 500;
}

/* Modal styles */
.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn {
  background: #4CAF50;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #45a049;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .room-lobby {
    padding: 15px;
  }

  .lobby-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .room-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .room-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style> 