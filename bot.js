/**
 * @digest WeChat Bot using wechaty-puppet-wechat
 */

const { WechatyBuilder } = require('wechaty');
const config = require('./config');

const botName = config.BOTNAME;
const WECHAT_URL = 'https://web.weixin.qq.com/?lang=zh_CN';

// Create bot instance using WechatyBuilder with enhanced browser configuration
const bot = WechatyBuilder.build({
  name: botName,
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    timeout: 180000,  // Increase timeout to 3 minutes
    endpoint: WECHAT_URL,
    browserOptions: {
      headless: true,
      executablePath: '/usr/bin/chromium',  // Use installed Chromium
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--ignore-certificate-errors'
      ]
    },
    launchOptions: {
      ignoreDefaultArgs: ['--disable-extensions'],
      defaultViewport: {
        width: 1280,
        height: 800
      },
      waitForInitialPage: true,
      timeout: 180000
    },
    navigationOptions: {
      waitUntil: 'networkidle0',
      timeout: 180000
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
    throw e;
  }
};

module.exports = {
  bot,
  startBot
};
