const superagent = require('../config/superagent');

class ClaudeService {
  constructor() {
    this.apiUrl = process.env.CLAUDE_API_URL;
    this.apiKey = process.env.CLAUDE_API_KEY;
  }

  async rewriteToVideo(content) {
    try {
      const response = await superagent.post(this.apiUrl)
        .set('Authorization', `Bearer ${this.apiKey}`)
        .send({
          prompt: `请将以下文章改写成800-1000字的短视频文案，包含画面描述和旁白：\n\n${content}\n\n要求：\n1. 保持核心信息完整\n2. 使用简单易懂的语言\n3. 适合视频展示的节奏`,
          max_tokens: 2000,
          temperature: 0.7
        });

      return response.body.choices[0].text;
    } catch (error) {
      console.error('Claude API error:', error.message);
      throw error;
    }
  }
}

module.exports = new ClaudeService();
