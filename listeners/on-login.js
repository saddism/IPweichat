/**
 * @digest 登录模块
 * @digest 登录模块
 * @time 2022-01-10
 */
const schedule = require("../schedule");
const config = require("../config");
const moment = require("../utils/moment");
const request = require("../request");
const bot = require("../bot");
const util = require('../utils');
const fs = require("fs");
const path = require("path");

/**
 * @digest 登录事件监听
 * @param {登录的微信用户} user
 */
async function onLogin(user) {
  console.log(`${user}登录了`);
  await rolling();
  await rest();
  await backup();
}

/**
 * @func 定时群消息
 * @time 9:00
 */
async function rolling() {
  schedule.setSchedule(
    "group",
    {
      hour: 9,
      minute: 0,
    },
    async () => {
      const today = moment().format("MM月DD日");
      const poison = await request.getSoup();
      const {realtime} = await request.getWeather('武汉');
      const str =
        `\n---------------\n` +
        `今天是${today},你毕业设计做完了吗?\n` +
        `---------------\n` +
        `${poison}\n` +
        `---------------\n` +
        `武汉天气：${realtime.temperature}℃ ${realtime.info}`;

      for (const roomName of config.WEBROOM) {
        const room = await bot.Room.find({ topic: roomName });
        if (room) {
          const members = Array.from(room.members.values());
          await room.say(str, ...members);
        }
      }
    }
  );
}

/**
 * @func 久坐提醒(30min/次)
 * @time 8:30-18:30
 */
async function rest() {
  schedule.setSchedule("rest1", { hour: 8, minute: 30 }, () => {
    util.log("久坐提醒已上线");

    schedule.setSchedule("start", "*/30 * * * *", async () => {
      util.log("time for rest");
      const master = await bot.Contact.find({ alias: config.MYSELF });
      if (master) {
        await master.say(`工作30min了，让眼睛休息下吧！`);
      }
    });

    schedule.setSchedule(
      "rest2",
      { hour: 18, minute: 30 },
      () => {
        const success = schedule.cancelJobName("start");
        util.log(success === true ? "久坐提醒已关闭" : "久坐提醒已失败");
      }
    );
  });
}

/**
 * @func 微信容灾备份措施
 * @time 每天24:10
 */
async function backup() {
  schedule.setSchedule("backup", {hour: 0, minute: 10}, async () => {
    util.log("backup file is being generated");
    const fileName = moment().format("YYYY-MM-DD") + ".txt";
    let writeStream = fs.createWriteStream(path.join(__dirname,'../backup',fileName));

    writeStream.once("open", () => util.log("stream open"));
    writeStream.once("close", () => util.log("stream close"));

    const contacts = Array.from(bot.contacts.values());
    for (const contact of contacts) {
      if (contact.type === bot.Contact.Type.Individual) {
        const contactData = `\nname: ${contact.name}\n` +
                          `alias: ${contact.alias}\n` +
                          `number: ${contact.id}\n`;
        writeStream.write(contactData);
      }
    }
    writeStream.close();
  });
}

module.exports = onLogin;
