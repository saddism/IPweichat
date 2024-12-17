/**
 * @digest WeChat Bot using wechaty-puppet-wechat
 */

const { WechatyBuilder } = require('wechaty');
const config = require('./config');

const botName = config.BOTNAME;

// Browser configuration with increased timeouts and enhanced stability
const browserConfig = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-sync',
    '--disable-translate',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-notifications',
    '--disable-web-security',
    '--ignore-certificate-errors',
    '--no-first-run',
    '--window-size=1920,1080',
    '--start-maximized',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-features=site-per-process'
  ],
  timeout: 180000, // 3 minutes
  navigationTimeout: 180000,
  defaultViewport: {
    width: 1920,
    height: 1080
  }
};

// Create bot instance with enhanced configuration
const bot = WechatyBuilder.build({
  name: botName,
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    browserOptions: browserConfig,
    retryTimes: 10,
    retryDelay: 15000
  }
});

// Start bot with enhanced error handling and retry mechanism
const startBot = async () => {
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 30000; // 30 seconds

  const attemptStart = async () => {
    try {
      console.log(`Starting bot (attempt ${retryCount + 1}/${maxRetries})...`);
      await bot.start();
      console.log(`Bot ${botName} started successfully`);
      return true;
    } catch (e) {
      console.error(`Failed to start bot: ${e}`);
      if (e.message.includes('timeout')) {
        console.log('Attempting graceful cleanup...');
        try {
          await bot.stop();
        } catch (stopError) {
          console.error('Error during cleanup:', stopError);
        }
        return false;
      }
      throw e;
    }
  };

  while (retryCount < maxRetries) {
    if (await attemptStart()) {
      return;
    }
    retryCount++;
    if (retryCount < maxRetries) {
      console.log(`Waiting ${retryDelay/1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error(`Failed to start bot after ${maxRetries} attempts`);
};

module.exports = {
  bot,
  startBot
};
