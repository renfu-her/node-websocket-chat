const db = require("./db");
const util = require("./utils");
const fs = require('fs');

module.exports = {
  // 保存用户
  saveUser(user, status) {
    console.log(user.name, status);
    if (status === 'login') {
      return db.insertUser(user);
    }
  },

  // 保存消息
  async saveMessage(from, to, message, type) {
    if (type === 'image') {
      const base64Data = message.replace(/^data:image\/\w+;base64,/, "");
      const dataBuffer = new Buffer.from(base64Data, 'base64');
      const filename = util.MD5(base64Data);
      fs.writeFileSync(`./upload/${filename}.png`, dataBuffer);
      message = `/assets/images/${filename}.png`;
    }
    
    console.log("\033[36m" + from.name + "\033[0m对<\033[36m" + to.name + "\033[0m>:\033[32m" + message + "\033[0m");
    
    const messageData = {
      from,
      to,
      content: message,
      type,
      time: new Date().getTime()
    };
    
    return db.insertMessage(messageData);
  },

  // 获取消息列表
  getMessages() {
    return db.getMessages(100);
  },

  // 获取用户列表
  getUsers() {
    return db.getUsers(100);
  },

  // 根据用户名查找用户
  findUserByName(name) {
    return db.findUserByName(name);
  },

  // 根据邮箱查找用户
  findUserByEmail(email) {
    return db.findUserByEmail(email);
  },

  // 验证用户登录
  async validateUser(email, password) {
    const user = await db.validateUser(email, password);
    if (!user) {
      return null;
    }
    
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  },

  // 注册新用户
  async registerUser(userData) {
    const bcrypt = require('bcryptjs');
    
    // 检查邮箱是否已存在
    const existingUser = await db.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('邮箱已被注册');
    }

    // 检查用户名是否已存在
    const existingName = await db.findUserByName(userData.name);
    if (existingName) {
      throw new Error('用户名已被使用');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      avatarUrl: userData.avatarUrl,
      ip: userData.ip,
      deviceType: userData.deviceType,
      roomId: userData.roomId,
      type: userData.type || 'user',
      time: userData.time
    };

    return db.insertUser(user);
  },

  // 删除用户
  deleteUser(id) {
    return db.deleteUser(id);
  },

  // 清理旧消息
  cleanOldMessages(days = 30) {
    return db.cleanOldMessages(days);
  },

  // 获取指定会话的消息
  getSessionMessages(sessionId, limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM messages 
                   WHERE to_id = ? OR from_id = ? 
                   ORDER BY time DESC LIMIT ?`;
      
      db.db.all(sql, [sessionId, sessionId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const messages = rows.reverse().map(row => ({
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

  // 搜索消息
  searchMessages(keyword, limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM messages 
                   WHERE content LIKE ? OR from_name LIKE ? OR to_name LIKE ?
                   ORDER BY time DESC LIMIT ?`;
      
      const searchPattern = `%${keyword}%`;
      
      db.db.all(sql, [searchPattern, searchPattern, searchPattern, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
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

  // 获取用户统计信息
  getUserStats() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT 
                     COUNT(*) as total_users,
                     COUNT(CASE WHEN time > ? THEN 1 END) as active_users_today
                   FROM users`;
      
      const today = Date.now() - (24 * 60 * 60 * 1000);
      
      db.db.get(sql, [today], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // 获取消息统计信息
  getMessageStats() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT 
                     COUNT(*) as total_messages,
                     COUNT(CASE WHEN time > ? THEN 1 END) as messages_today,
                     COUNT(CASE WHEN type = 'image' THEN 1 END) as image_messages
                   FROM messages`;
      
      const today = Date.now() - (24 * 60 * 60 * 1000);
      
      db.db.get(sql, [today], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
};
