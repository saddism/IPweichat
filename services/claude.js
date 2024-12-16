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
        messages: [
          {
            role: "user",
            content: `Please rewrite the following content into a short video script format, including visual descriptions and narration:\n\n${content}`,
          }
        ],
        model: "claude-3-5-sonnet@20240620"
      });

      return message.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error.message);
      throw error;
    }
  }
}

module.exports = new ClaudeService();
