const fs = require('fs');
const path = require('path');

// 旧数据库文件路径
const oldUsersDb = path.join(__dirname, '../db/users.db');
const oldMessagesDb = path.join(__dirname, '../db/messages.db');

// 新数据库文件路径
const newDbPath = path.join(__dirname, '../db/database.sqlite');

function cleanup() {
  console.log('🧹 清理旧的 NeDB 文件...\n');

  // 检查新数据库是否存在
  if (!fs.existsSync(newDbPath)) {
    console.log('❌ 新数据库文件不存在，请先运行迁移脚本');
    return;
  }

  console.log('✅ 新数据库文件存在');

  // 检查备份目录是否存在
  const backupDir = path.join(__dirname, '../db/backup');
  if (!fs.existsSync(backupDir)) {
    console.log('❌ 备份目录不存在，请先运行迁移脚本');
    return;
  }

  console.log('✅ 备份目录存在');

  // 删除旧文件
  let deletedCount = 0;

  if (fs.existsSync(oldUsersDb)) {
    fs.unlinkSync(oldUsersDb);
    console.log('🗑️  已删除: users.db');
    deletedCount++;
  }

  if (fs.existsSync(oldMessagesDb)) {
    fs.unlinkSync(oldMessagesDb);
    console.log('🗑️  已删除: messages.db');
    deletedCount++;
  }

  if (deletedCount === 0) {
    console.log('ℹ️  没有找到旧的 NeDB 文件需要删除');
  } else {
    console.log(`\n✅ 清理完成！删除了 ${deletedCount} 个旧文件`);
    console.log('💡 旧数据已备份到 db/backup/ 目录，可以安全删除');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  try {
    cleanup();
  } catch (error) {
    console.error('清理过程中发生错误:', error);
    process.exit(1);
  }
}

module.exports = { cleanup }; 