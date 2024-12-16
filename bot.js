/**
 * @digest Bot initialization and management
 */
const { Wechaty } = require("wechaty");
const { PuppetPadlocal } = require("wechaty-puppet-padlocal");
const { LoginPolicy } = require("padlocal-client-ts/dist/proto/padlocal_pb");
const config = require("./config");

// Load token from environment through config
const token = process.env.WECHATY_PUPPET_PADLOCAL_TOKEN || config.PUPPET_TOKEN;
const botName = config.BOTNAME;

if (!token) {
  throw new Error('WECHATY_PUPPET_PADLOCAL_TOKEN is required. Please set it in your .env file.');
}

class BotSingleton {
  constructor() {
    if (!BotSingleton.instance) {
      BotSingleton.instance = new Wechaty({
        puppet: new PuppetPadlocal({
          token,
          defaultLoginPolicy: LoginPolicy.DEFAULT,
          deviceInfo: {
            deviceType: 'iPad',
            deviceId: `iPad-${Math.random().toString(36).substring(2,10)}`,
          }
        }),
        name: botName
      });
    }
  }

  static getInstance() {
    if (!BotSingleton.instance) {
      new BotSingleton();
    }
    return BotSingleton.instance;
  }

  static async startBot() {
    const bot = BotSingleton.getInstance();
    try {
      // Remove all existing listeners and reset login state
      bot.removeAllListeners();

      // Register event handlers
      const login = require("./listeners/on-login");
      const message = require("./listeners/on-message");
      const scan = require("./listeners/on-scan");
      const friendship = require("./listeners/on-friendship");
      const roomJoin = require("./listeners/on-room-join");
      const roomLeave = require("./listeners/on-room-leave");

      bot.on("login", login);
      bot.on("message", message);
      bot.on("scan", scan);
      bot.on("friendship", friendship);
      bot.on("room-join", roomJoin);
      bot.on("room-leave", roomLeave);

      // Only start if not already started
      if (!bot.isLoggedOn) {
        console.log("开始登陆微信");
        await bot.start();
      }
    } catch (e) {
      console.error("启动失败:", e);
      process.exit(1);
    }
  }
}

module.exports = {
  bot: BotSingleton.getInstance(),
  startBot: BotSingleton.startBot
};
