/**
 * @digest WeChat Bot using wechaty-puppet-wechat
 */

const { WechatyBuilder } = require('wechaty');
const config = require('./config');

const botName = config.BOTNAME;

// Create bot instance using WechatyBuilder with enhanced browser options
const bot = WechatyBuilder.build({
  name: botName,
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    puppeteer: {
      timeout: 120000, // Increase timeout to 2 minutes
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--deterministic-fetch',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--single-process'
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
