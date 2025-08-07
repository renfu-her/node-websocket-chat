const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../db/database.sqlite');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    return;
  }
  console.log('已连接到 SQLite 数据库');
});

// 检查数据库
async function checkDatabase() {
  try {
    // 检查表结构
    console.log('\n=== 检查表结构 ===');
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('Users 表字段:');
    tableInfo.forEach(row => {
      console.log(`- ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
    });

    // 检查用户数据
    console.log('\n=== 检查用户数据 ===');
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT id, name, email, image, avatarUrl FROM users LIMIT 5', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`找到 ${users.length} 个用户:`);
    users.forEach((user, index) => {
      console.log(`\n用户 ${index + 1}:`);
      console.log(`- ID: ${user.id}`);
      console.log(`- Name: ${user.name}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Image: ${user.image || '(NULL)'}`);
      console.log(`- AvatarUrl: ${user.avatarUrl || '(NULL)'}`);
    });

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    db.close();
  }
}

// 运行检查
checkDatabase();
