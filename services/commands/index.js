const config = require('../../backend/config/config');
const claudeService = require('../claude');
const request = require('../../request');

class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.initializeCommands();
  }

  // Register a new command with multiple triggers
  register(triggers, handler, description) {
    triggers.forEach(trigger => {
      this.commands.set(trigger, { handler, description });
    });
  }

  // Execute a command if it matches
  async execute(command, context) {
    const cmd = this.commands.get(command);
    if (cmd) {
      return await cmd.handler(context);
    }
    return null;
  }

  // Initialize default commands
  initializeCommands() {
    // Rewrite command
    this.register(['改写短视频', '改写'], async (context) => {
      const { lastMessage, currentMessage } = context;

      if (!lastMessage || !lastMessage.text()) {
        throw new Error('找不到需要改写的内容');
      }

      const articleUrl = lastMessage.text();
      if (!articleUrl.includes('mp.weixin.qq.com')) {
        throw new Error('请确保上一条消息是公众号文章链接');
      }

      // Extract content from the article
      const articleContent = await request.getArticleContent(articleUrl);

      // Get current prompt and writing style
      const prompts = await config.getConfig('prompts');
      const styles = await config.getConfig('writingStyles');
      const defaultPrompt = prompts.default;
      const defaultStyle = styles.default;

      // Rewrite content using Claude
      const rewrittenContent = await claudeService.rewriteToVideo(articleContent);
      return rewrittenContent;
    }, '将公众号文章改写成短视频脚本');

    // Save command
    this.register(['保存', '存'], async (context) => {
      const { lastMessage } = context;

      if (!lastMessage || !lastMessage.text()) {
        throw new Error('找不到需要保存的内容');
      }

      const content = lastMessage.text();
      if (!content.includes('mp.weixin.qq.com')) {
        throw new Error('请确保要保存的内容是公众号文章');
      }

      // Save to content library (implement in backend later)
      const timestamp = Date.now();
      const contentData = {
        url: content,
        savedAt: timestamp,
        content: await request.getArticleContent(content)
      };

      // Store in backend
      await config.updateConfig('contentLibrary', `article_${timestamp}`, contentData);
      return '内容已保存到文案库';
    }, '保存公众号文章到文案库');
  }
}

module.exports = new CommandRegistry();
