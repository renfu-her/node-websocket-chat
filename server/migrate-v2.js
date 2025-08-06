const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// 数据库文件路径
const dbPath = path.join(__dirname, '../db/database.sqlite');

// 备份当前数据库
function backupCurrentDatabase() {
  const backupDir = path.join(__dirname, '../db/backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `database.backup.${timestamp}.sqlite`);
  
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`当前数据库已备份到: ${backupPath}`);
  }
}

// 迁移到新版本
async function migrateToV2() {
  console.log('🔄 开始数据库迁移到 V2...');
  console.log('添加密码和邮箱字段');
  console.log('========================');

  try {
    // 备份当前数据库
    backupCurrentDatabase();

    // 创建新数据库连接
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
        return;
      }
      console.log('已连接到 SQLite 数据库');
    });

    // 开始事务
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 1. 创建新的用户表结构
    console.log('\n1. 创建新的用户表结构...');
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS users_v2 (
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
        if (err) reject(err);
        else resolve();
      });
    });

    // 2. 迁移现有用户数据
    console.log('\n2. 迁移现有用户数据...');
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`找到 ${users.length} 个用户需要迁移`);

    for (const user of users) {
      // 为现有用户生成默认密码和邮箱
      const defaultPassword = await bcrypt.hash('123456', 10);
      const defaultEmail = `${user.name}@example.com`;
      
      await new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO users_v2 
          (id, name, email, password, avatarUrl, ip, deviceType, roomId, type, time) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          user.id,
          user.name,
          defaultEmail,
          defaultPassword,
          user.avatarUrl,
          user.ip,
          user.deviceType,
          user.roomId,
          user.type,
          user.time
        ], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      
      console.log(`已迁移用户: ${user.name} -> ${defaultEmail}`);
    }

    // 3. 删除旧表并重命名新表
    console.log('\n3. 更新表结构...');
    await new Promise((resolve, reject) => {
      db.run('DROP TABLE IF EXISTS users', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE users_v2 RENAME TO users', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 4. 创建索引
    console.log('\n4. 创建索引...');
    await new Promise((resolve, reject) => {
      db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 提交事务
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('\n========================');
    console.log('✅ 数据库迁移 V2 完成!');
    console.log(`- 迁移用户: ${users.length} 个`);
    console.log('- 添加了密码和邮箱字段');
    console.log('- 默认密码: 123456');
    console.log('- 默认邮箱: username@example.com');

  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    
    // 回滚事务
    const db = new sqlite3.Database(dbPath);
    db.run('ROLLBACK', () => {
      console.log('已回滚事务');
      process.exit(1);
    });
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateToV2().then(() => {
    console.log('\n迁移脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('迁移失败:', error);
    process.exit(1);
  });
}

module.exports = { migrateToV2 }; 