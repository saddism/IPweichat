/**
 * @author Devin
 * @time 2024-01-15
 * @digest Configuration file for loading environment variables
 */
require('dotenv').config();

module.exports = {
  PUPPET_TOKEN: process.env.WECHATY_PUPPET_PADLOCAL_TOKEN,  // Updated to use correct env var name
  BOTNAME: process.env.BOT_NAME,
  CLAUDE_API_URL: process.env.CLAUDE_API_URL,
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY
};
