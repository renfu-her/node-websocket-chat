const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../db/database.sqlite');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已连接到 SQLite 数据库');
    initDatabase();
  }
});

// 初始化数据库表
function initDatabase() {
  // 创建用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatarUrl TEXT,
    ip TEXT,
    deviceType TEXT,
    roomId TEXT,
    type TEXT DEFAULT 'user',
    time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('创建用户表失败:', err.message);
    } else {
      console.log('用户表创建成功或已存在');
    }
  });

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
      console.log('房间表创建成功或已存在');
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
      console.log('房间消息表创建成功或已存在');
    }
  });

  // 创建消息表
  db.run(`CREATE TABLE IF NOT EXISTS messages (
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
  )`, (err) => {
    if (err) {
      console.error('创建消息表失败:', err.message);
    } else {
      console.log('消息表创建成功或已存在');
    }
  });

  // 创建索引以提高查询性能
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_time ON messages(time)', (err) => {
    if (err) {
      console.error('创建消息时间索引失败:', err.message);
    }
  });

  db.run('CREATE INDEX IF NOT EXISTS idx_messages_from_id ON messages(from_id)', (err) => {
    if (err) {
      console.error('创建消息发送者索引失败:', err.message);
    }
  });

  db.run('CREATE INDEX IF NOT EXISTS idx_messages_to_id ON messages(to_id)', (err) => {
    if (err) {
      console.error('创建消息接收者索引失败:', err.message);
    }
  });

  db.run('CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)', (err) => {
    if (err) {
      console.error('创建用户名索引失败:', err.message);
    }
  });

  db.run('CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id)', (err) => {
    if (err) {
      console.error('创建房间消息房间索引失败:', err.message);
    }
  });

  db.run('CREATE INDEX IF NOT EXISTS idx_room_messages_time ON room_messages(time)', (err) => {
    if (err) {
      console.error('创建房间消息时间索引失败:', err.message);
    }
  });

  db.run('CREATE INDEX IF NOT EXISTS idx_rooms_owner_id ON rooms(owner_id)', (err) => {
    if (err) {
      console.error('创建房间所有者索引失败:', err.message);
    }
  });
}

// 数据库操作方法
const dbOperations = {
  // 插入用户
  insertUser: (user) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT OR REPLACE INTO users 
        (id, name, email, password, avatarUrl, image, ip, deviceType, roomId, type, time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      db.run(sql, [
        user.id,
        user.name,
        user.email,
        user.password,
        user.avatarUrl,
        user.image || user.avatarUrl, // 使用 avatarUrl 作為 image 的預設值
        user.ip,
        user.deviceType,
        user.roomId,
        user.type,
        user.time
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...user });
        }
      });
    });
  },

  // 插入消息
  insertMessage: (message) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO messages 
        (from_id, from_name, from_avatarUrl, from_ip, from_deviceType, 
         to_id, to_name, to_type, content, type, time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      db.run(sql, [
        message.from.id,
        message.from.name,
        message.from.avatarUrl,
        message.from.ip,
        message.from.deviceType,
        message.to.id,
        message.to.name,
        message.to.type,
        message.content,
        message.type,
        message.time
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...message });
        }
      });
    });
  },

  // 获取消息列表
  getMessages: (limit = 100) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM messages ORDER BY time ASC LIMIT ?`;
      
      db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // 转换数据格式以兼容现有代码
          const messages = rows.map(row => ({
            from: {
              id: row.from_id,
              name: row.from_name,
              avatarUrl: row.from_avatarUrl,
              ip: row.from_ip,
              deviceType: row.from_deviceType
            },
            to: {
              id: row.to_id,
              name: row.to_name,
              type: row.to_type
            },
            content: row.content,
            type: row.type,
            time: row.time
          }));
          resolve(messages);
        }
      });
    });
  },

  // 获取用户列表
  getUsers: (limit = 100) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users ORDER BY time ASC LIMIT ?`;
      
      db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // 根据用户名查找用户
  findUserByName: (name) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE name = ?`;
      
      db.get(sql, [name], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // 根据邮箱查找用户
  findUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE email = ?`;
      
      db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // 验证用户登录
  validateUser: (email, password) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE email = ?`;
      
      db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // 删除用户
  deleteUser: (id) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM users WHERE id = ?`;
      
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  },

  // 更新用户资料
  updateUser: (id, updateData) => {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      // 構建動態 SQL
      if (updateData.name !== undefined) {
        fields.push('name = ?');
        values.push(updateData.name);
      }
      if (updateData.email !== undefined) {
        fields.push('email = ?');
        values.push(updateData.email);
      }
      if (updateData.password !== undefined) {
        fields.push('password = ?');
        values.push(updateData.password);
      }
      if (updateData.image !== undefined) {
        fields.push('image = ?');
        values.push(updateData.image);
      }
      if (updateData.avatarUrl !== undefined) {
        fields.push('avatarUrl = ?');
        values.push(updateData.avatarUrl);
      }
      
      if (fields.length === 0) {
        reject(new Error('No fields to update'));
        return;
      }
      
      values.push(id);
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      
      db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  },

  // 清理旧消息
  cleanOldMessages: (days = 30) => {
    return new Promise((resolve, reject) => {
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const sql = `DELETE FROM messages WHERE time < ?`;
      
      db.run(sql, [cutoffTime], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  },

  // 创建房间
  createRoom: (room) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO rooms 
        (id, name, description, owner_id, owner_name, max_users) 
        VALUES (?, ?, ?, ?, ?, ?)`;
      
      db.run(sql, [
        room.id,
        room.name,
        room.description,
        room.owner_id,
        room.owner_name,
        room.max_users || 50
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: room.id, ...room });
        }
      });
    });
  },

  // 获取所有房间
  getRooms: () => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM rooms ORDER BY created_at DESC`;
      
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // 根据ID获取房间
  getRoomById: (roomId) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM rooms WHERE id = ?`;
      
      db.get(sql, [roomId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // 更新房间状态
  updateRoomStatus: (roomId, isOpen) => {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE rooms SET is_open = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      
      db.run(sql, [isOpen ? 1 : 0, roomId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  },

  // 更新房间用户数量
  updateRoomUserCount: (roomId, count) => {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE rooms SET current_users = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      
      db.run(sql, [count, roomId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ updated: this.changes });
        }
      });
    });
  },

  // 删除房间
  deleteRoom: (roomId) => {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM rooms WHERE id = ?`;
      
      db.run(sql, [roomId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  },

  // 插入房间消息
  insertRoomMessage: (message) => {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO room_messages 
        (room_id, from_id, from_name, from_avatarUrl, from_ip, from_deviceType, content, type, time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      db.run(sql, [
        message.room_id,
        message.from.id,
        message.from.name,
        message.from.avatarUrl,
        message.from.ip,
        message.from.deviceType,
        message.content,
        message.type,
        message.time
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...message });
        }
      });
    });
  },

  // 获取房间消息
  getRoomMessages: (roomId, limit = 100) => {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM room_messages WHERE room_id = ? ORDER BY time ASC LIMIT ?`;
      
      db.all(sql, [roomId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // 转换数据格式以兼容现有代码
          const messages = rows.map(row => ({
            from: {
              id: row.from_id,
              name: row.from_name,
              avatarUrl: row.from_avatarUrl,
              ip: row.from_ip,
              deviceType: row.from_deviceType
            },
            to: {
              id: row.room_id,
              name: 'room',
              type: 'room'
            },
            content: row.content,
            type: row.type,
            time: row.time
          }));
          resolve(messages);
        }
      });
    });
  }
};

module.exports = {
  db,
  ...dbOperations
};
