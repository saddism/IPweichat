module.exports = {
  // Bot Configuration
  BOTNAME: process.env.BOT_NAME || 'Crystal',

  // WeChat Room Configuration
  WEBROOM: (process.env.WEBROOM || '').split(',').filter(Boolean),

  // Command Configuration
  COMMANDS: {
    REWRITE: ['改写短视频', '改写'],
    SAVE: ['保存', '存']
  },

  // API Configuration
  CLAUDE_API: {
    URL: process.env.CLAUDE_API_URL,
    KEY: process.env.CLAUDE_API_KEY
  },

  // Message Configuration
  MESSAGE: {
    REWRITE_SUCCESS: '内容已改写完成',
    REWRITE_ERROR: '改写失败，请稍后重试',
    SAVE_SUCCESS: '内容已保存到文案库',
    SAVE_ERROR: '保存失败，请稍后重试'
  }
};
