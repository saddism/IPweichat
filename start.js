/*
 * @Author: Yi Zhihang
 * @Create: 2022-01-28 11:39:08
 * @LastEditTime: 2022-02-02 21:30:13
 * @Description: 入口文件，启动机器人实例
 */
/*
 *                        _oo0oo_
 *                       o8888888o
 *                       88" . "88
 *                       (| -_- |)
 *                       0\  =  /0
 *                     ___/`---'\___
 *                   .' \\|     |// '.
 *                  / \\|||  :  |||// \
 *                 / _||||| -:- |||||- \
 *                |   | \\\  - /// |   |
 *                | \_|  ''\---/''  |_/ |
 *                \  .-\__  '-'  ___/-. /
 *              ___'. .'  /--.--\  `. .'___
 *           ."" '<  `.___\_<|>_/___.' >' "".
 *          | | :  `- \`.;`\ _ /`;.`/ - ` : | |
 *          \  \ `_.   \_ __\ /__ _/   .-` /  /
 *      =====`-.____`.___ \_____/___.-`___.-'=====
 *                        `=---='
 *
 *
 *      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *
 *            佛祖保佑     永不宕机     永无BUG
 */

const { LoginPolicy } = require('padlocal-client-ts/dist/proto/padlocal_pb');
const login = require("./listeners/on-login");
const message = require("./listeners/on-message");
const scan = require("./listeners/on-scan");
const friendship = require("./listeners/on-friendship");
const roomJoin = require("./listeners/on-room-join");
const roomLeave = require("./listeners/on-room-leave");

const bot = require("./bot");

// Ensure clean start
async function startBot() {
  try {
    // Remove all existing listeners and reset login state
    bot.removeAllListeners();

    // Register event handlers
    bot.on("login", login);
    bot.on("message", message);
    bot.on("scan", scan);
    bot.on("friendship", friendship);
    bot.on("room-join", roomJoin);
    bot.on("room-leave", roomLeave);

    // Only start if not already started
    if (!bot.isLoggedOn) {
      console.log("开始登陆微信");
      try {
        await bot.start();
      } catch (loginError) {
        console.error("登录失败:", loginError);
        // Force cleanup on login failure
        await bot.stop();
        process.exit(1);
      }
    }
  } catch (e) {
    console.error("启动失败:", e);
    process.exit(1);
  }
}

// Start the bot
startBot();
