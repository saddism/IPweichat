require('dotenv').config();

module.exports = {
  PUPPET_TOKEN: process.env.WECHATY_PUPPET_PADLOCAL_TOKEN,
  BOTNAME: process.env.BOT_NAME,
  CLAUDE_API_URL: process.env.CLAUDE_API_URL,
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY
};
