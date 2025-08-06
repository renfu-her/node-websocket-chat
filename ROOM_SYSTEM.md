# 房间系统功能说明

## 概述

WebChat 聊天室现已支持完整的房间系统，实现了用户登录 -> 房间大廳 -> 聊天室的完整流程。用户可以在房间大廳中创建新房间、加入现有房间，并在房间内进行实时聊天。

## 新功能特性

### 1. 房间大廳 (Room Lobby)
- ✅ 显示所有可用房间列表
- ✅ 房间信息展示 (名称、描述、房主、用户数量、状态)
- ✅ 创建新房间功能
- ✅ 加入现有房间功能
- ✅ 房间状态管理 (开放/关闭)

### 2. 房间聊天 (Room Chat)
- ✅ 实时房间消息发送和接收
- ✅ 房间消息历史记录
- ✅ 房间用户列表显示
- ✅ 房间信息展示
- ✅ 离开房间功能
- ✅ 房主关闭房间功能

### 3. 房主权限管理
- ✅ 房主可以关闭房间
- ✅ 房间关闭时自动踢出所有用户
- ✅ 房主标识显示

## 用户流程

### 登录流程
1. 用户登录或注册
2. 登录成功后进入房间大廳
3. 在房间大廳中选择房间或创建新房间
4. 进入房间进行聊天

### 房间管理流程
1. **创建房间**: 点击"创建房间"按钮，填写房间信息
2. **加入房间**: 点击房间的"加入房间"按钮
3. **离开房间**: 点击"离开房间"按钮
4. **关闭房间**: 房主可以点击"关闭房间"按钮

## 数据库结构

### 房间表 (rooms)
```sql
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  is_open INTEGER DEFAULT 1,
  max_users INTEGER DEFAULT 50,
  current_users INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 房间消息表 (room_messages)
```sql
CREATE TABLE room_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  from_id TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_avatarUrl TEXT,
  from_ip TEXT,
  from_deviceType TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  time INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 技术实现

### 后端实现

#### Socket.io 事件处理
- `create-room`: 创建新房间
- `join-room`: 加入房间
- `leave-room`: 离开房间
- `close-room`: 关闭房间
- `room-message`: 房间消息
- `get-rooms`: 获取房间列表

#### 数据库操作
- `createRoom()`: 创建房间
- `getRooms()`: 获取所有房间
- `getRoomById()`: 根据ID获取房间
- `updateRoomStatus()`: 更新房间状态
- `updateRoomUserCount()`: 更新房间用户数量
- `insertRoomMessage()`: 插入房间消息
- `getRoomMessages()`: 获取房间消息

### 前端实现

#### 组件结构
- `RoomLobby.vue`: 房间大廳组件
- `RoomChat.vue`: 房间聊天组件
- `ChatApp.vue`: 主应用组件 (已更新)

#### 主要功能
- 房间列表展示和管理
- 房间创建表单
- 实时消息发送和接收
- 房间用户列表
- 房间状态管理

## 使用方法

### 创建房间
1. 在房间大廳点击"创建房间"按钮
2. 填写房间名称 (必填)
3. 填写房间描述 (可选)
4. 设置最大用户数量 (默认50)
5. 点击"创建房间"确认

### 加入房间
1. 在房间大廳查看可用房间列表
2. 点击想要加入的房间的"加入房间"按钮
3. 系统会自动加入房间并显示聊天界面

### 房间聊天
1. 在房间聊天界面可以看到房间信息和用户列表
2. 在消息输入框中输入消息
3. 按回车键或点击"发送"按钮发送消息
4. 可以查看房间内的消息历史

### 管理房间
- **房主**: 可以关闭房间，关闭后所有用户会被踢出
- **普通用户**: 可以离开房间，返回房间大廳

## 安全特性

### 权限控制
- 只有房主可以关闭房间
- 房间关闭后所有用户自动退出
- 用户只能加入开放状态的房间

### 数据验证
- 房间名称必填且长度限制
- 最大用户数量限制
- 房间状态验证

### 错误处理
- 房间不存在时的错误提示
- 房间已满时的错误提示
- 房间已关闭时的错误提示

## 示例房间

系统会自动创建以下示例房间：
- **一般聊天室**: 欢迎来到一般聊天室，这里可以自由聊天
- **遊戲討論室**: 讨论各种游戏话题
- **技術交流室**: 技术讨论和分享

## 迁移说明

### 数据库迁移
运行以下命令进行房间系统数据库迁移：
```bash
npm run migrate-v3
```

### 功能兼容性
- 房间系统与现有的用户认证系统完全兼容
- 现有的私聊功能保持不变
- 房间消息与普通消息分开存储

## 未来扩展

### 计划功能
- [ ] 房间密码保护
- [ ] 房间分类和标签
- [ ] 房间公告功能
- [ ] 房间管理员系统
- [ ] 房间消息搜索
- [ ] 房间文件共享

### 性能优化
- [ ] 房间消息分页加载
- [ ] 房间用户在线状态优化
- [ ] 房间消息缓存机制 