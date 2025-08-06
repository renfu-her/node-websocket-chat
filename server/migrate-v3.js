const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, '../db/database.sqlite');

console.log('开始房间系统数据库迁移...');

// 检查数据库文件是否存在
if (!fs.existsSync(dbPath)) {
  console.error('数据库文件不存在，请先运行初始迁移脚本');
  process.exit(1);
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  } else {
    console.log('已连接到 SQLite 数据库');
    migrateRooms();
  }
});

function migrateRooms() {
  console.log('开始创建房间相关表...');

  // 创建房间表
  db.run(`CREATE TABLE IF NOT EXISTS rooms (
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
  )`, (err) => {
    if (err) {
      console.error('创建房间表失败:', err.message);
    } else {
      console.log('房间表创建成功');
    }
  });

  // 创建房间消息表
  db.run(`CREATE TABLE IF NOT EXISTS room_messages (
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
  )`, (err) => {
    if (err) {
      console.error('创建房间消息表失败:', err.message);
    } else {
      console.log('房间消息表创建成功');
    }
  });

  // 创建索引
  db.run('CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id)', (err) => {
    if (err) {
      console.error('创建房间消息房间索引失败:', err.message);
    } else {
      console.log('房间消息房间索引创建成功');
    }
  });

  db.run('CREATE INDEX IF NOT EXISTS idx_room_messages_time ON room_messages(time)', (err) => {
    if (err) {
      console.error('创建房间消息时间索引失败:', err.message);
    } else {
      console.log('房间消息时间索引创建成功');
    }
  });

  db.run('CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON rooms(owner_id)', (err) => {
    if (err) {
      console.error('创建房间所有者索引失败:', err.message);
    } else {
      console.log('房间所有者索引创建成功');
    }
  });

  // 创建一些示例房间
  setTimeout(() => {
    createSampleRooms();
  }, 1000);
}

function createSampleRooms() {
  console.log('创建示例房间...');

  const sampleRooms = [
    {
      id: 'room_general_' + Date.now(),
      name: '一般聊天室',
      description: '歡迎來到一般聊天室，這裡可以自由聊天',
      owner_id: 'system',
      owner_name: '系統',
      is_open: 1,
      max_users: 50,
      current_users: 0
    },
    {
      id: 'room_gaming_' + Date.now(),
      name: '遊戲討論室',
      description: '討論各種遊戲話題',
      owner_id: 'system',
      owner_name: '系統',
      is_open: 1,
      max_users: 30,
      current_users: 0
    },
    {
      id: 'room_tech_' + Date.now(),
      name: '技術交流室',
      description: '技術討論和分享',
      owner_id: 'system',
      owner_name: '系統',
      is_open: 1,
      max_users: 40,
      current_users: 0
    }
  ];

  let completed = 0;
  sampleRooms.forEach(room => {
    db.run(`INSERT OR IGNORE INTO rooms 
      (id, name, description, owner_id, owner_name, is_open, max_users, current_users) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      [room.id, room.name, room.description, room.owner_id, room.owner_name, room.is_open, room.max_users, room.current_users],
      function(err) {
        if (err) {
          console.error(`创建示例房间 ${room.name} 失败:`, err.message);
        } else {
          console.log(`示例房间 ${room.name} 创建成功`);
        }
        completed++;
        if (completed === sampleRooms.length) {
          finishMigration();
        }
      }
    );
  });
}

function finishMigration() {
  console.log('房间系统数据库迁移完成！');
  console.log('现在可以启动应用程序并测试房间功能了。');
  
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接失败:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
    process.exit(0);
  });
} 