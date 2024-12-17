const { Anthropic } = require('@anthropic-ai/sdk');
const { log, warn } = require('../utils');
const fs = require('fs');
const moment = require('moment');

// Enhanced logging function for API interactions
const logAPI = (type, details) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logEntry = `[CLAUDE-API] ${timestamp} ${type}: ${JSON.stringify(details, null, 2)}`;
  console.log(logEntry);
  const logFile = `logs/${moment().format('YYYY-MM-DD')}.log`;
  fs.appendFileSync(logFile, logEntry + '\n');
};

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
      baseURL: process.env.CLAUDE_API_URL
    });
    log('Claude服务初始化完成', `API URL: ${process.env.CLAUDE_API_URL}`);
  }

  async rewriteArticle(content) {
    try {
      logAPI('REQUEST', {
        action: 'rewrite_article',
        content_length: content.length,
        timestamp: new Date().toISOString()
      });

      const message = await this.client.messages.create({
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `请将以下文章改写成800-1000字的短视频文案，包含画面描述和旁白：\n\n${content}\n\n要求：\n1. 保持核心信息完整\n2. 使用简单易懂的语言\n3. 适合视频展示的节奏`
        }],
        model: "claude-3-5-sonnet@20240620"
      });

      logAPI('RESPONSE', {
        action: 'rewrite_article',
        content_length: message.content.length,
        timestamp: new Date().toISOString()
      });

      return message.content;
    } catch (error) {
      logAPI('ERROR', {
        action: 'rewrite_article',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}

module.exports = new ClaudeService();
