/**
 * @digest WeChat Bot using wechaty-puppet-wechat
 */

const { WechatyBuilder } = require('wechaty');
const config = require('./config');

const botName = config.BOTNAME;

// Enhanced browser configuration with UOS support
const browserConfig = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
  ],
  headless: true,
  ignoreHTTPSErrors: true,
  defaultViewport: null,
};

// Create bot instance with UOS configuration
const bot = WechatyBuilder.build({
  name: botName,
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    head: false,
    stealthless: false, // Enable stealth plugin
    uos: true, // Enable UOS mode
    launchOptions: browserConfig,
  }
});

// Start bot with enhanced error handling and retry mechanism
const startBot = async () => {
  const maxRetries = 3;
  let retryCount = 0;

  const attemptStart = async () => {
    try {
      console.log(`Starting bot (attempt ${retryCount + 1}/${maxRetries})...`);
      await bot.start();
      console.log('Bot started successfully');
    } catch (error) {
      console.error('Failed to start bot:', error);

      if (error.message.includes('Navigation Timeout')) {
        console.log('Navigation timeout detected, cleaning up...');
        try {
          await bot.stop();
          await new Promise(resolve => setTimeout(resolve, 10000)); // Increased cooldown
        } catch (stopError) {
          console.error('Error during cleanup:', stopError);
        }
      }

      if (retryCount < maxRetries - 1) {
        retryCount++;
        console.log(`Retrying in 10 seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Increased wait time
        return attemptStart();
      } else {
        console.error('Max retries reached. Bot failed to start.');
        throw error;
      }
    }
  };

  return attemptStart();
};

module.exports = {
  bot,
  startBot
};
