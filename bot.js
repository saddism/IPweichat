/**
 * @digest WeChat Bot using wechaty-puppet-wechat
 */

const { WechatyBuilder } = require('wechaty');
const config = require('./config');

const botName = config.BOTNAME;

// Create bot instance using WechatyBuilder with enhanced browser configuration
const bot = WechatyBuilder.build({
  name: botName,
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    timeout: 120000,  // Increase timeout to 2 minutes
    endpoint: 'https://wx.qq.com/?lang=zh_CN&target=t',  // Specify WeChat web endpoint
    uos: true,  // Enable uos mode for better compatibility
    browserOptions: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
      ]
    }
  }
});

// Start bot with error handling
const startBot = async () => {
  try {
    await bot.start();
    console.log(`Bot ${botName} started successfully`);
  } catch (e) {
    console.error(`Failed to start bot: ${e}`);
    throw e; // Re-throw to allow caller to handle
  }
};

module.exports = {
  bot,
  startBot
};
