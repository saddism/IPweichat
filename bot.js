/**
 * @author Hilbert Yi
 * @time 2022-01-11
 * @digest 入口文件
 */
const { Wechaty } = require("wechaty");
const config = require("./config");

const botName = config.BOTNAME;

// 创建机器人
const bot = new Wechaty({
  name: botName
});

module.exports = bot;

// Note: Using web protocol instead of padlocal since it's more accessible for testing
// To use padlocal protocol later, uncomment:
// const {PuppetPadlocal} = require("wechaty-puppet-padlocal");
// const token = config.PUPPET_TOKEN;
// const bot = new Wechaty({
//   puppet: new PuppetPadlocal({
//     token
//   }),
//   name: botName
// });
