/**
 * @digest 入口文件
 */
const { Wechaty } = require("wechaty");
const config = require("./config");

const botName = config.BOTNAME;

// 创建机器人
const bot = new Wechaty({
  name: botName,
  puppet: 'wechaty-puppet-wechat'  // Switch to web protocol
});

module.exports = bot;
