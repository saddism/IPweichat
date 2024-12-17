/**
 * @digest WeChat Bot using wechaty-puppet-wechat
 */

const { WechatyBuilder } = require('wechaty');
const config = require('./config');

const botName = config.BOTNAME;

// Minimal browser configuration to avoid detection
const browserConfig = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
  ],
  headless: true,
  ignoreHTTPSErrors: true,
  defaultViewport: null,
};

// Create bot instance with puppet configuration
const bot = WechatyBuilder.build({
  name: botName,
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    head: false,
    stealthless: false, // Enable stealth plugin
    launchOptions: browserConfig,
  }
});

// Start bot with enhanced error handling
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
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (stopError) {
          console.error('Error during cleanup:', stopError);
        }
      }

      if (retryCount < maxRetries - 1) {
        retryCount++;
        console.log(`Retrying in 5 seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
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
