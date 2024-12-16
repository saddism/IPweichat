/**
 * @digest 入口文件
 */
const { Wechaty } = require("wechaty");
const { PuppetPadlocal } = require("wechaty-puppet-padlocal");
const config = require("./config");

// Load token from environment through config
const token = process.env.WECHATY_PUPPET_PADLOCAL_TOKEN || config.PUPPET_TOKEN;
const botName = config.BOTNAME;

if (!token) {
  throw new Error('WECHATY_PUPPET_PADLOCAL_TOKEN is required. Please set it in your .env file.');
}

// Create a singleton bot instance
let botInstance = null;

const createBot = () => {
  if (!botInstance) {
    botInstance = new Wechaty({
      puppet: new PuppetPadlocal({
        token
      }),
      name: botName
    });
  }
  return botInstance;
};

module.exports = createBot();
