const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, '../db/database.sqlite');

// 备份数据库函数
function backupCurrentDatabase() {
  const backupDir = path.join(__dirname, '../db/backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `database_backup_v4_${timestamp}.sqlite`);
  
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`数据库已备份到: ${backupPath}`);
  }
}

// 迁移到新版本
async function migrateToV4() {
  console.log('🔄 开始数据库迁移到 V4...');
  console.log('添加 image 字段到 users 表');
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

    // 1. 检查 image 字段是否已存在
    console.log('\n1. 检查 image 字段...');
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const hasImageField = tableInfo.some(row => row.name === 'image');
    
    if (hasImageField) {
      console.log('image 字段已存在，跳过添加');
    } else {
      // 2. 添加 image 字段
      console.log('\n2. 添加 image 字段到 users 表...');
      await new Promise((resolve, reject) => {
        db.run('ALTER TABLE users ADD COLUMN image TEXT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('image 字段添加成功');
    }

    // 3. 创建索引（如果不存在）
    console.log('\n3. 创建索引...');
    await new Promise((resolve, reject) => {
      db.run('CREATE INDEX IF NOT EXISTS idx_users_image ON users(image)', (err) => {
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

    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err.message);
      } else {
        console.log('数据库连接已关闭');
      }
    });

    console.log('\n========================');
    console.log('✅ 数据库迁移到 V4 完成!');
    console.log('✅ image 字段已添加到 users 表');
    console.log('✅ 索引已创建');

  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行迁移
migrateToV4();
