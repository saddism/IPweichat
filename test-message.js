const bot = require("./bot");
const { log, warn } = require("./utils");
const fs = require('fs');
const path = require('path');

async function simulateMessage() {
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    log("=== 开始全面日志测试 ===");
    log("1. 测试消息输出");
    log("2. 测试回复指示器");
    log("3. 测试连接日志");
    log("4. 测试Claude API交互");

    const mockUser = {
      name: () => "Test User",
      id: () => "test-user-id"
    };

    const mockRoom = {
      topic: () => "Test Room",
      say: (text) => log(`回复消息: ${text}`),
      id: () => "test-room-id",
      messages: async (count) => {
        // Simulate recent messages including a WeChat article
        return [
          {
            text: () => "https://mp.weixin.qq.com/s/test-article-url",
            type: () => bot.Message.Type.Text,
            talker: () => mockUser
          },
          {
            text: () => "@Crystal 改写",
            type: () => bot.Message.Type.Text,
            talker: () => mockUser
          }
        ];
      }
    };

    // Test regular message
    const regularMessage = {
      text: () => "普通消息测试",
      toString: () => "普通消息测试",
      room: () => mockRoom,
      from: () => mockUser,
      talker: () => mockUser,
      age: () => 0,
      type: () => bot.Message.Type.Text,
      self: () => false,
      mentionSelf: () => false,
      toRecalled: () => false,
      listener: () => null,
      content: () => "普通消息测试"
    };

    // Test command message that should trigger Claude
    const commandMessage = {
      text: () => "@Crystal 改写",
      toString: () => "@Crystal 改写",
      room: () => mockRoom,
      from: () => mockUser,
      talker: () => mockUser,
      age: () => 0,
      type: () => bot.Message.Type.Text,
      self: () => false,
      mentionSelf: () => true,
      toRecalled: () => false,
      listener: () => null,
      content: () => "@Crystal 改写"
    };

    log("\n=== 测试1: 普通消息处理 ===");
    await require("./listeners/on-message")(regularMessage);

    log("\n=== 测试2: 命令消息处理 ===");
    await require("./listeners/on-message")(commandMessage);

    // Verify logs exist and contain required information
    const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8');
      log("\n=== 日志验证结果 ===");
      log(`消息输出: ${logs.includes('普通消息测试') ? '✓' : '✗'}`);
      log(`回复指示: ${logs.includes('将回复消息') ? '✓' : '✗'}`);
      log(`连接日志: ${logs.includes('建立连接') ? '✓' : '✗'}`);
      log(`Claude API: ${logs.includes('Claude API请求') ? '✓' : '✗'}`);
    }

    log("\n=== 测试完成 ===");
  } catch (error) {
    warn(`测试错误: ${error.message}\n${error.stack}`);
  }
}

simulateMessage();
