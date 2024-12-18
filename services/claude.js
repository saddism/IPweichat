const { Anthropic } = require('@anthropic-ai/sdk');
const { log, warn } = require('../utils');
const moment = require('moment');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
      baseURL: process.env.CLAUDE_API_URL
    });
    log('Claude服务初始化完成');
    log(`API地址: ${process.env.CLAUDE_API_URL}`);
  }

  async rewriteArticle(content) {
    try {
      log('开始调用Claude API改写文章...');
      log(`原文长度: ${content.length} 字符`);

      // Log request details
      const request = {
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `请将以下文章改写成800-1000字的短视频文案，包含画面描述和旁白：\n\n${content}\n\n要求：\n1. 保持核心信息完整\n2. 使用简单易懂的语言\n3. 适合视频展示的节奏`
        }],
        model: "claude-3-5-sonnet@20240620"
      };

      log('Claude API请求内容:');
      log(JSON.stringify(request, null, 2));

      const message = await this.client.messages.create(request);

      // Log response details
      log('Claude API响应内容:');
      log(JSON.stringify(message, null, 2));

      log('Claude API调用成功');
      log(`生成内容长度: ${message.content.length} 字符`);
      return message.content;
    } catch (error) {
      warn(`Claude API调用失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ClaudeService();
