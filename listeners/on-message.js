/*
 * @author Hilbert Yi
 * @digest 消息监听
 * @time 2022-01-11
 */
const bot = require("../bot.js");
const request = require("../request");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const { FileBox } = require('file-box');
const config = require("../config");
const reg = require("../config/RegularExpression");
const language = require("../config/language");
const util = require("../utils");
const cipher = require("../utils/cipher");
const ImageHosting = require("../utils/Image-Hosting");
const schedule = require("../schedule");

function logMessage(type, message, details = {}) {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const willReply = details.willReply;
  const logEntry = {
    type,
    timestamp,
    message,
    ...details
  };

  // Enhanced console output with reply indicator
  const replyIndicator = willReply ? '🔄 将回复' : '⏭️ 不回复';
  console.log(`[${type}] ${timestamp} ${replyIndicator} ${message}`);
  if (Object.keys(details).length > 0) {
    console.log('Details:', JSON.stringify(details, null, 2));
  }

  const logFile = path.join(__dirname, '../logs', `${moment().format('YYYY-MM-DD')}.log`);
  fs.appendFileSync(logFile, `[${type}] ${timestamp} ${replyIndicator} ${message}\n`);
  if (Object.keys(details).length > 0) {
    fs.appendFileSync(logFile, `Details: ${JSON.stringify(details, null, 2)}\n`);
  }
}

const logInfo = (message, details = {}) => logMessage('INFO', message, details);
const logWarn = (message, details = {}) => logMessage('WARN', message, details);
const logError = (message, details = {}) => logMessage('ERROR', message, details);
const logAPI = (method, endpoint, request, response) => {
  logMessage('API', `${method} ${endpoint}`, {
    request,
    response,
    timestamp: new Date().toISOString()
  });
};

const rewrittenArticles = new Set();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const recent = msg => {
  const age = msg.age();
  logInfo(`检查消息时效性`, { age });
  return age < 60;
};

let wxSignature = 'initial';
async function getWxSignature() {
  try {
    wxSignature = await request.getSignature();
    logInfo(`签名更新成功`, { signature: wxSignature });
  } catch (error) {
    logError(`签名更新失败`, { error: error.message });
  }
  return wxSignature;
}
setInterval(getWxSignature, 7200000);

async function onMessage(msg) {
  try {
    if (!recent(msg)) {
      logInfo('忽略超时消息');
      return;
    }

    if (msg.self()) {
      logInfo('忽略自己发送的消息');
      return;
    }

    const room = msg.room();
    const contact = msg.talker();
    const content = msg.text();
    const msgType = msg.type();

    logInfo(`收到消息`, {
      type: msgType,
      sender: contact.name(),
      content,
      isRoom: !!room,
      willReply: content === "菜单" || reg.TRANSLATE.test(content) || reg.REWRITE_VIDEO.test(content)
    });

    if (room) {
      const roomName = await room.topic();
      logInfo(`群聊消息`, { roomName });

      if (config.WEBROOM.includes(roomName)) {
        await onWebRoomMessage(msg);
      } else {
        logInfo('非监听群聊，忽略消息');
      }
    } else {
      const isText = msgType === bot.Message.Type.Text;
      const isImg = msgType === bot.Message.Type.Image;

      if (isText || isImg) {
        logInfo('处理私聊消息');
        await onPeopleMessage(msg);
      } else {
        logInfo('忽略非文本/图片消息');
      }
    }
  } catch (error) {
    logError(`消息处理错误`, { error: error.message, stack: error.stack });
  }
}

async function onPeopleMessage(msg) {
  const isText = msg.type() === bot.Message.Type.Text;
  const isImg = msg.type() === bot.Message.Type.Image;
  const contact = msg.talker();
  const content = msg.text();
  const sender = await contact.alias() || contact.name();

  logInfo(`处理私聊消息`, {
    type: msg.type(),
    sender,
    content
  });

  if (isImg) {
    try {
      logInfo('处理图片消息');
      const file = await msg.toFileBox();
      const base64 = await ImageHosting.upload(file);
      logInfo('图片上传成功', { filename: file.name });
      await msg.say(base64);
      return true;
    } catch (error) {
      logError('图片处理失败', { error: error.message });
      return false;
    }
  }

  if (!isText) {
    logInfo('忽略非文本消息');
    return false;
  }

  if (sender === config.MYSELF) {
    logInfo('处理特权消息');
  }

  if (content === "菜单") {
    logInfo('响应菜单请求');
    try {
      await delay(200);
      await msg.say(config.KEYWORDS());
      logInfo('菜单发送成功');
      return true;
    } catch (error) {
      logError('菜单发送失败', { error: error.message });
      return false;
    }
  }

  if (reg.TRANSLATE.test(content)) {
    logInfo('处理翻译请求');
    try {
      const result = language.analysis(content);
      logInfo('翻译分析结果', result);
      const translation = await request.translate(result.query, result.from, result.to);
      logAPI('POST', '/translate', result, translation);
      await msg.say(translation.trans_result[0].dst);
      logInfo('翻译发送成功');
      return true;
    } catch (error) {
      logError('翻译失败', { error: error.message });
      await delay(200);
      await msg.say('接口异常或指令格式错误，请联系客服！');
      return false;
    }
  }

  return await onUtilsMessage(msg);
}

async function onWebRoomMessage(msg) {
  const isText = msg.type() === bot.Message.Type.Text;
  const room = msg.room();
  const contact = msg.talker();
  let content = msg.text();

  logInfo(`群聊消息处理`, {
    roomTopic: await room.topic(),
    sender: contact.name(),
    content
  });

  if (await msg.mentionSelf()) {
    logInfo('收到@提及消息');
    content = content.replace(`@${config.BOTNAME}\u2005`, "").trim();
    logInfo(`处理后的内容: ${content}`);

    if (reg.REWRITE_VIDEO.test(content)) {
      logInfo('检测到改写命令');
      try {
        logInfo('获取最近消息历史...');
        const recentMessages = await room.messages(2);

        let articleUrl = null;
        for (const message of recentMessages) {
          const msgUrl = message.text().match(/(https?:\/\/[^\s]+)/);
          if (msgUrl && msgUrl[1].includes('mp.weixin.qq.com')) {
            articleUrl = msgUrl[1];
            logInfo(`找到文章链接`, { url: articleUrl });
            break;
          }
        }

        if (!articleUrl) {
          logWarn('未找到最近的公众号文章链接');
          await room.say("未找到最近的公众号文章链接");
          return;
        }

        if (rewrittenArticles.has(articleUrl)) {
          logInfo('文章已被改写过');
          await room.say("该文章已经改写过了");
          return;
        }

        await room.say("好的，我会开始改写这篇文章了。");

        logInfo('正在获取文章内容...');
        const articleContent = await request.article.getArticleContent(articleUrl);
        logInfo(`获取到文章内容`, { length: articleContent.length });

        const claudeService = require('../services/claude');
        logInfo('开始调用Claude API改写文章...');
        const rewrittenContent = await claudeService.rewriteArticle(articleContent);

        logInfo('发送改写结果到群聊...');
        if (rewrittenContent && Array.isArray(rewrittenContent)) {
          const formattedContent = rewrittenContent
            .filter(item => item.type === 'text')
            .map(item => item.text)
            .join('\n');
          await room.say(formattedContent);
        } else {
          logWarn('改写结果格式异常', { content: rewrittenContent });
          await room.say('抱歉，改写结果格式有误，请稍后重试。');
        }

        rewrittenArticles.add(articleUrl);
        logInfo('文章改写完成并已记录');
        return;
      } catch (error) {
        logError('处理改写请求失败', { error: error.message });
        await room.say('抱歉，处理改写请求时出现错误。请确保上一条消息是公众号文章链接。');
        return;
      }
    }

    logInfo('非改写命令，按普通消息处理');
    await onPeopleMessage(msg);
    return;
  }
}

async function onUtilsMessage(msg) {
  const isText = msg.type() === bot.Message.Type.Text;
  const content = msg.text();

  logInfo(`处理工具消息`, { content });

  if (isText) {
    if (content.indexOf("转大写") === 0) {
      try {
        const str = content.replace("转大写", "").trim().toUpperCase();
        await msg.say(str);
        logInfo('大写转换成功');
        return true;
      } catch (error) {
        logError('大写转换失败', { error: error.message });
        await msg.say("转换失败，请检查");
        return true;
      }
    }

    if (content.includes("天气")) {
      logInfo('处理天气查询');
      try {
        let cityName = content.replace("天气", "").trim();
        logInfo('查询天气', { city: cityName });
        const { city, realtime, future } = await request.getWeather(cityName);
        logAPI('GET', '/weather', { city: cityName }, { city, realtime, future });

        let weatherStr = `城市：${city}\n${moment().format("MM月DD日")}：${realtime.temperature}℃ ${realtime.info}\n`;
        weatherStr += `----------\n未来五天   天气预报\n----------\n`;
        for (let i = 1; i <= 5; i++) {
          weatherStr += `${moment().add(i, "d").format("MM月DD日")}：${future[i-1].temperature} ${future[i-1].weather}\n`;
        }

        await delay(200);
        await msg.say(weatherStr);
        logInfo('天气信息发送成功');
        return true;
      } catch (error) {
        logError('天气查询失败', { error: error.message });
        msg.say("请输入[城市名 天气]");
        return true;
      }
    }

    logInfo('非工具消息');
    return false;
  }

  logInfo('非文本消息');
  return false;
}

module.exports = onMessage;
