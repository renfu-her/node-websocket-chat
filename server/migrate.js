const Datastore = require('nedb');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 旧数据库路径
const oldUsersDb = path.join(__dirname, '../db/users.db');
const oldMessagesDb = path.join(__dirname, '../db/messages.db');

// 新数据库路径
const newDbPath = path.join(__dirname, '../db/database.sqlite');

// 检查旧数据库文件是否存在
function checkOldDatabase() {
  const usersExists = fs.existsSync(oldUsersDb);
  const messagesExists = fs.existsSync(oldMessagesDb);
  
  console.log('检查旧数据库文件:');
  console.log(`- users.db: ${usersExists ? '存在' : '不存在'}`);
  console.log(`- messages.db: ${messagesExists ? '存在' : '不存在'}`);
  
  return usersExists || messagesExists;
}

// 迁移用户数据
async function migrateUsers() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(oldUsersDb)) {
      console.log('用户数据库文件不存在，跳过用户数据迁移');
      resolve([]);
      return;
    }

    const oldDb = new Datastore({ filename: oldUsersDb, autoload: true });
    const newDb = new sqlite3.Database(newDbPath);

    oldDb.find({}, (err, users) => {
      if (err) {
        reject(err);
        return;
      }

      if (users.length === 0) {
        console.log('没有用户数据需要迁移');
        resolve([]);
        return;
      }

      console.log(`开始迁移 ${users.length} 个用户...`);

      const insertSql = `INSERT OR REPLACE INTO users 
        (id, name, avatarUrl, ip, deviceType, roomId, type, time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      let completed = 0;
      users.forEach((user, index) => {
        newDb.run(insertSql, [
          user.id || user._id,
          user.name,
          user.avatarUrl,
          user.ip,
          user.deviceType,
          user.roomId,
          user.type || 'user',
          user.time
        ], function(err) {
          if (err) {
            console.error(`迁移用户 ${user.name} 失败:`, err.message);
          } else {
            completed++;
            console.log(`已迁移用户: ${user.name} (${completed}/${users.length})`);
          }

          if (completed === users.length) {
            console.log('用户数据迁移完成');
            resolve(users);
          }
        });
      });
    });
  });
}

// 迁移消息数据
async function migrateMessages() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(oldMessagesDb)) {
      console.log('消息数据库文件不存在，跳过消息数据迁移');
      resolve([]);
      return;
    }

    const oldDb = new Datastore({ filename: oldMessagesDb, autoload: true });
    const newDb = new sqlite3.Database(newDbPath);

    oldDb.find({}, (err, messages) => {
      if (err) {
        reject(err);
        return;
      }

      if (messages.length === 0) {
        console.log('没有消息数据需要迁移');
        resolve([]);
        return;
      }

      console.log(`开始迁移 ${messages.length} 条消息...`);

      const insertSql = `INSERT INTO messages 
        (from_id, from_name, from_avatarUrl, from_ip, from_deviceType, 
         to_id, to_name, to_type, content, type, time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      let completed = 0;
      messages.forEach((message, index) => {
        newDb.run(insertSql, [
          message.from.id || message.from._id,
          message.from.name,
          message.from.avatarUrl,
          message.from.ip,
          message.from.deviceType,
          message.to.id || message.to._id,
          message.to.name,
          message.to.type,
          message.content,
          message.type || 'text',
          message.time
        ], function(err) {
          if (err) {
            console.error(`迁移消息失败:`, err.message);
          } else {
            completed++;
            if (completed % 100 === 0 || completed === messages.length) {
              console.log(`已迁移消息: ${completed}/${messages.length}`);
            }
          }

          if (completed === messages.length) {
            console.log('消息数据迁移完成');
            resolve(messages);
          }
        });
      });
    });
  });
}

// 备份旧数据库
function backupOldDatabase() {
  const backupDir = path.join(__dirname, '../db/backup');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  if (fs.existsSync(oldUsersDb)) {
    const backupUsersPath = path.join(backupDir, `users.db.backup.${timestamp}`);
    fs.copyFileSync(oldUsersDb, backupUsersPath);
    console.log(`用户数据库已备份到: ${backupUsersPath}`);
  }

  if (fs.existsSync(oldMessagesDb)) {
    const backupMessagesPath = path.join(backupDir, `messages.db.backup.${timestamp}`);
    fs.copyFileSync(oldMessagesDb, backupMessagesPath);
    console.log(`消息数据库已备份到: ${backupMessagesPath}`);
  }
}

// 主迁移函数
async function migrate() {
  console.log('开始数据库迁移...');
  console.log('从 NeDB 迁移到 SQLite3');
  console.log('========================');

  try {
    // 检查旧数据库
    if (!checkOldDatabase()) {
      console.log('没有找到旧数据库文件，迁移完成');
      return;
    }

    // 备份旧数据库
    console.log('\n备份旧数据库...');
    backupOldDatabase();

    // 确保新数据库目录存在
    const dbDir = path.dirname(newDbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 创建新数据库连接
    const newDb = new sqlite3.Database(newDbPath, (err) => {
      if (err) {
        console.error('创建新数据库失败:', err.message);
        return;
      }
      console.log('新数据库连接成功');
    });

    // 创建表结构
    console.log('\n创建数据库表结构...');
    await new Promise((resolve, reject) => {
      newDb.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatarUrl TEXT,
        ip TEXT,
        deviceType TEXT,
        roomId TEXT,
        type TEXT DEFAULT 'user',
        time INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

         await new Promise((resolve, reject) => {
       newDb.run(`CREATE TABLE IF NOT EXISTS messages (
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
         if (err) reject(err);
         else resolve();
       });
     });

    // 迁移数据
    console.log('\n开始迁移数据...');
    const users = await migrateUsers();
    const messages = await migrateMessages();

    console.log('\n========================');
    console.log('数据库迁移完成!');
    console.log(`- 迁移用户: ${users.length} 个`);
    console.log(`- 迁移消息: ${messages.length} 条`);
    console.log(`- 新数据库: ${newDbPath}`);
    console.log('\n注意: 旧数据库文件已备份，可以安全删除');

  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrate().then(() => {
    console.log('迁移脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('迁移失败:', error);
    process.exit(1);
  });
}

module.exports = { migrate }; 