/**
 * @digest WeChat Bot using wechaty-puppet-wechat
 */

const { WechatyBuilder } = require('wechaty');
const config = require('./config');

const botName = config.BOTNAME;

// Create bot instance using WechatyBuilder with minimal configuration
const bot = WechatyBuilder.build({
  name: botName,
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    headless: false,  // Show browser for debugging
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
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
