const { Anthropic } = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
      baseURL: process.env.CLAUDE_API_URL
    });
  }

  async rewriteToVideo(content) {
    try {
      const message = await this.client.messages.create({
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `请将以下文章改写成800-1000字的短视频文案，包含画面描述和旁白：\n\n${content}\n\n要求：\n1. 保持核心信息完整\n2. 使用简单易懂的语言\n3. 适合视频展示的节奏`
        }],
        model: "claude-3-5-sonnet@20240620"
      });
      return message.content;
    } catch (error) {
      console.error('Claude API Error:', error);
      throw error;
    }
  }
}

module.exports = new ClaudeService();
