# 数据库迁移指南

## 概述

本项目已从 NeDB 数据库迁移到 SQLite3 数据库，提供更好的性能和功能。

## 迁移步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 运行迁移脚本

```bash
npm run migrate
```

迁移脚本会自动：
- 检查现有的 NeDB 数据库文件
- 备份旧数据到 `db/backup/` 目录
- 创建新的 SQLite3 数据库
- 迁移所有用户和消息数据
- 创建必要的索引

### 3. 启动应用

```bash
npm run prod
```

## 数据库结构

### 用户表 (users)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatarUrl TEXT,
  ip TEXT,
  deviceType TEXT,
  roomId TEXT,
  type TEXT DEFAULT 'user',
  time INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 消息表 (messages)
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_avatarUrl TEXT,
  from_ip TEXT,
  from_deviceType TEXT,
  to_id TEXT NOT NULL,
  to_name TEXT NOT NULL,
  to_type TEXT DEFAULT 'user',
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  time INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 索引

为提高查询性能，已创建以下索引：
- `idx_messages_time` - 消息时间索引
- `idx_messages_from_id` - 消息发送者索引
- `idx_messages_to_id` - 消息接收者索引
- `idx_users_name` - 用户名索引

## 新功能

### 1. 消息搜索
```javascript
// 搜索包含关键词的消息
const messages = await store.searchMessages('关键词');
```

### 2. 用户统计
```javascript
// 获取用户统计信息
const stats = await store.getUserStats();
// 返回: { total_users: 100, active_users_today: 25 }
```

### 3. 消息统计
```javascript
// 获取消息统计信息
const stats = await store.getMessageStats();
// 返回: { total_messages: 1000, messages_today: 50, image_messages: 20 }
```

### 4. 自动清理
```javascript
// 清理30天前的旧消息
await store.cleanOldMessages(30);
```

## 文件结构

```
db/
├── database.sqlite          # 新的 SQLite3 数据库文件
├── backup/                  # 旧数据库备份目录
│   ├── users.db.backup.2024-01-01T12-00-00-000Z
│   └── messages.db.backup.2024-01-01T12-00-00-000Z
├── users.db                 # 旧的 NeDB 用户数据库 (可删除)
└── messages.db              # 旧的 NeDB 消息数据库 (可删除)
```

## 注意事项

1. **备份**: 迁移前会自动备份旧数据，备份文件保存在 `db/backup/` 目录
2. **兼容性**: 新的数据库操作完全兼容现有代码
3. **性能**: SQLite3 提供更好的查询性能和并发支持
4. **维护**: 定期运行 `cleanOldMessages()` 清理旧消息以保持性能

## 故障排除

### 迁移失败
如果迁移过程中出现错误：
1. 检查 `db/backup/` 目录中的备份文件
2. 删除 `db/database.sqlite` 文件
3. 重新运行 `npm run migrate`

### 数据库连接错误
如果应用启动时出现数据库连接错误：
1. 确保 `db/database.sqlite` 文件存在
2. 检查文件权限
3. 确保 `db/` 目录可写

## 回滚

如果需要回滚到 NeDB：
1. 停止应用
2. 删除 `db/database.sqlite`
3. 从 `db/backup/` 恢复 NeDB 文件
4. 修改 `server/db.js` 和 `server/store.js` 回退到 NeDB 版本
5. 重新安装 `nedb` 依赖

## 性能对比

| 功能 | NeDB | SQLite3 |
|------|------|---------|
| 查询性能 | 中等 | 优秀 |
| 并发支持 | 有限 | 良好 |
| 数据完整性 | 基本 | 完整 |
| 索引支持 | 无 | 完整 |
| 事务支持 | 无 | 完整 |
| 文件大小 | 较大 | 较小 | 