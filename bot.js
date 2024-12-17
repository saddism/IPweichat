/**
 * @author Hilbert Yi
 * @time 2022-01-11
 * @digest WeChat Bot using wechaty-puppet-wechat
 */
import { WechatyBuilder } from 'wechaty';
import { config } from './config.js';

const botName = config.BOTNAME;

// Create bot instance using WechatyBuilder
const bot = WechatyBuilder.build({
  name: botName,
  puppet: 'wechaty-puppet-wechat'
});

// Start bot with error handling
export const startBot = async () => {
  try {
    await bot.start();
    console.log(`Bot ${botName} started successfully`);
  } catch (e) {
    console.error(`Failed to start bot: ${e}`);
    throw e; // Re-throw to allow caller to handle
  }
};

export default bot;
