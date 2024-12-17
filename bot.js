/**
 * @digest WeChat Bot using wechaty-puppet-wechat
 */

const { WechatyBuilder } = require('wechaty');
const config = require('./config');

const botName = config.BOTNAME;

// Browser configuration with increased timeouts
const browserConfig = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-sync',
    '--disable-translate'
  ],
  timeout: 120000, // Increase timeout to 2 minutes
  navigationTimeout: 120000
};

// Create bot instance with enhanced configuration
const bot = WechatyBuilder.build({
  name: botName,
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    browserOptions: browserConfig,
    retryTimes: 5,
    retryDelay: 10000
  }
});

// Start bot with enhanced error handling
const startBot = async () => {
  try {
    console.log('Starting bot with enhanced configuration...');
    await bot.start();
    console.log(`Bot ${botName} started successfully`);
  } catch (e) {
    console.error(`Failed to start bot: ${e}`);
    // Attempt graceful shutdown of browser if it's a timeout error
    if (e.message.includes('timeout')) {
      console.log('Attempting graceful shutdown and restart...');
      await bot.stop();
      await new Promise(resolve => setTimeout(resolve, 5000));
      await bot.start();
    } else {
      throw e;
    }
  }
};

module.exports = {
  bot,
  startBot
};
