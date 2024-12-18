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
  try {
    util.log('登录事件触发');
    util.log(`用户 ${user.name()} (ID: ${user.id}) 登录成功`);
    util.log(`用户类型: ${user.type()}`);
    util.log('正在初始化定时任务...');

    await rolling();
    await rest();
    await backup();

    util.log('所有定时任务初始化完成');
  } catch (error) {
    util.warn(`登录处理发生错误: ${error.message}`);
    throw error; // Re-throw to allow upper layers to handle
  }
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
      try {
        util.log('开始执行定时群消息任务...');
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
          try {
            const room = await bot.Room.find({ topic: roomName });
            if (room) {
              const members = Array.from(room.members.values());
              util.log(`正在发送消息到群: ${roomName}`);
              await room.say(str, ...members);
              util.log(`成功发送消息到群: ${roomName}`);
            }
          } catch (roomError) {
            util.warn(`发送消息到群 ${roomName} 失败: ${roomError.message}`);
          }
        }
      } catch (error) {
        util.warn("定时群消息发送失败: " + error.message);
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
    try {
      util.log("久坐提醒已上线");

      schedule.setSchedule("start", "*/30 * * * *", async () => {
        try {
          util.log("time for rest");
          const master = await bot.Contact.find({ alias: config.MYSELF });
          if (master) {
            await master.say(`工作30min了，让眼睛休息下吧！`);
          }
        } catch (error) {
          util.log("休息提醒发送失败:", error);
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
    } catch (error) {
      util.log("久坐提醒设置失败:", error);
    }
  });
}

/**
 * @func 微信容灾备份措施
 * @time 每天24:10
 */
async function backup() {
  schedule.setSchedule("backup", {hour: 0, minute: 10}, async () => {
    try {
      util.log("backup file is being generated");
      const backupDir = path.join(__dirname, '../backup');

      // Ensure backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const fileName = moment().format("YYYY-MM-DD") + ".txt";
      let writeStream = fs.createWriteStream(path.join(backupDir, fileName));

      writeStream.once("open", () => util.log("stream open"));
      writeStream.once("close", () => util.log("stream close"));
      writeStream.once("error", (err) => util.log("stream error:", err));

      const contacts = Array.from(bot.contacts.values());
      for (const contact of contacts) {
        if (contact.type === bot.Contact.Type.Individual) {
          const contactData = `\nname: ${contact.name}\n` +
                          `alias: ${contact.alias}\n` +
                          `number: ${contact.id}\n`;
          writeStream.write(contactData);
        }
      }
      writeStream.end();
    } catch (error) {
      util.log("backup error:", error);
    }
  });
}

module.exports = onLogin;
