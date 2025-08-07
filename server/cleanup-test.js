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

// 清理测试数据
async function cleanupTestData() {
  try {
    // 恢复第一个用户的原始数据
    const updateData = {
      name: 'tester',
      image: null
    };

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
    
    values.push('wsV-reMd6IzdmbnIAAAR'); // 第一个用户的ID
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    console.log('清理测试数据...');
    console.log('SQL:', sql);
    console.log('参数:', values);

    await new Promise((resolve, reject) => {
      db.run(sql, values, function(err) {
        if (err) reject(err);
        else {
          console.log('清理完成，影响行数:', this.changes);
          resolve();
        }
      });
    });

  } catch (error) {
    console.error('清理失败:', error);
  } finally {
    db.close();
  }
}

// 运行清理
cleanupTestData();
