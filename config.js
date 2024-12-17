/**
 * @author Hilbert Yi
 * @time 2022-01-11
 * @digest Bot configuration
 */

require('dotenv').config();

const config = {
  // Bot Configuration
  BOTNAME: process.env.BOT_NAME || 'Crystal',
  DEBUG: process.env.DEBUG === 'true',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Room Configuration
  WEBROOM: (process.env.WEBROOM || '').split(','),

  // User Configuration
  MYSELF: process.env.MYSELF || '',
  IGNORE: (process.env.IGNORE || '').split(','),

  // Weather API Configuration
  WEATHER_KEY: process.env.WEATHER_KEY,

  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CHATGPT_TRIGGER_KEYWORD: process.env.CHATGPT_TRIGGER_KEYWORD,
};

module.exports = config;
