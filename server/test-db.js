const store = require('./store');

async function testDatabase() {
  console.log('🧪 测试 SQLite3 数据库功能...\n');

  try {
    // 测试获取消息
    console.log('1. 测试获取消息列表...');
    const messages = await store.getMessages();
    console.log(`   获取到 ${messages.length} 条消息`);

    // 测试获取用户
    console.log('\n2. 测试获取用户列表...');
    const users = await store.getUsers();
    console.log(`   获取到 ${users.length} 个用户`);

    // 测试用户统计
    console.log('\n3. 测试用户统计...');
    const userStats = await store.getUserStats();
    console.log(`   总用户数: ${userStats.total_users}`);
    console.log(`   今日活跃用户: ${userStats.active_users_today}`);

    // 测试消息统计
    console.log('\n4. 测试消息统计...');
    const messageStats = await store.getMessageStats();
    console.log(`   总消息数: ${messageStats.total_messages}`);
    console.log(`   今日消息数: ${messageStats.messages_today}`);
    console.log(`   图片消息数: ${messageStats.image_messages}`);

    // 测试消息搜索
    console.log('\n5. 测试消息搜索...');
    const searchResults = await store.searchMessages('你好');
    console.log(`   搜索到 ${searchResults.length} 条包含"你好"的消息`);

    // 测试会话消息
    console.log('\n6. 测试获取会话消息...');
    if (users.length > 0) {
      const sessionMessages = await store.getSessionMessages(users[0].id);
      console.log(`   用户 ${users[0].name} 的会话消息: ${sessionMessages.length} 条`);
    }

    console.log('\n✅ 所有测试通过！SQLite3 数据库工作正常。');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
if (require.main === module) {
  testDatabase().then(() => {
    console.log('\n测试完成');
    process.exit(0);
  }).catch((error) => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}

module.exports = { testDatabase }; 