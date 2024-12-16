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
          prompt: `Please rewrite the following content into a short video script format, including visual descriptions and narration:\n\n${content}`,
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
