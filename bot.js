/**
 * @digest WeChat Bot using wechaty-puppet-wechat
 */

const { WechatyBuilder } = require('wechaty');
const config = require('./config');

const botName = config.BOTNAME;

// Browser configuration with proper puppet options
const browserConfig = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-sync',
    '--disable-translate',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-notifications',
    '--disable-web-security',
    '--ignore-certificate-errors',
    '--no-first-run',
    '--proxy-server="direct://"',
    '--proxy-bypass-list=*',
    '--start-maximized'
  ],
  headless: true,
  timeout: 0, // Disable timeout
  defaultViewport: null,
  ignoreHTTPSErrors: true
};

// Create bot instance with puppet configuration
const bot = WechatyBuilder.build({
  name: botName,
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    head: false,
    stealthless: true,
    launchOptions: browserConfig,
    retryTimes: 15,
    retryDelay: 30000
  }
});

// Start bot with retry mechanism
const startBot = async () => {
  const maxRetries = 3;
  let retryCount = 0;

  const attemptStart = async () => {
    try {
      await bot.start();
      console.log('Bot started successfully');
    } catch (error) {
      console.error('Failed to start bot:', error);

      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying... Attempt ${retryCount} of ${maxRetries}`);

        // Wait before retrying
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
