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
    timeout: 180000,  // Increase timeout to 3 minutes
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
    },
    launchOptions: {
      ignoreDefaultArgs: ['--disable-extensions'],
      defaultViewport: {
        width: 1280,
        height: 800
      },
      waitForInitialPage: true,
      timeout: 180000,  // Match the puppet timeout
      protocolTimeout: 180000  // Add protocol timeout
    },
    navigationOptions: {
      waitUntil: 'networkidle0',
      timeout: 180000  // Match the puppet timeout
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
