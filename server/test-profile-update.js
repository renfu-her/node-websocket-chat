const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

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

// 测试更新用户资料
async function testUpdateProfile() {
  try {
    // 获取第一个用户
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      console.log('没有找到用户');
      return;
    }

    console.log('当前用户资料:');
    console.log('- ID:', user.id);
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Image:', user.image);
    console.log('- AvatarUrl:', user.avatarUrl);

    // 更新用户资料
    const updateData = {
      name: user.name + '_updated',
      image: '/static/img/user/test-image.png'
    };

    // 构建更新 SQL
    const fields = [];
    const values = [];
    
    if (updateData.name !== undefined) {
      fields.push('name = ?');
      values.push(updateData.name);
    }
    if (updateData.image !== undefined) {
      fields.push('image = ?');
      values.push(updateData.image);
    }
    
    values.push(user.id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    console.log('\n执行更新 SQL:', sql);
    console.log('参数:', values);

    await new Promise((resolve, reject) => {
      db.run(sql, values, function(err) {
        if (err) reject(err);
        else {
          console.log('更新影响行数:', this.changes);
          resolve();
        }
      });
    });

    // 验证更新结果
    const updatedUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    console.log('\n更新后的用户资料:');
    console.log('- ID:', updatedUser.id);
    console.log('- Name:', updatedUser.name);
    console.log('- Email:', updatedUser.email);
    console.log('- Image:', updatedUser.image);
    console.log('- AvatarUrl:', updatedUser.avatarUrl);

  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    db.close();
  }
}

// 运行测试
testUpdateProfile();
