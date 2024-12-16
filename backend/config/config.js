const path = require('path');
const fs = require('fs').promises;

const CONFIG_DIR = path.join(__dirname, '../data');
const CONFIG_FILES = {
  apiKeys: 'api_keys.json',
  prompts: 'prompts.json',
  writingStyles: 'writing_styles.json'
};

// Ensure config directory exists
async function initializeConfig() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    // Initialize config files if they don't exist
    for (const [type, filename] of Object.entries(CONFIG_FILES)) {
      const filePath = path.join(CONFIG_DIR, filename);
      try {
        await fs.access(filePath);
      } catch {
        // Create default configuration structure
        const defaultConfig = {
          apiKeys: {},
          prompts: {
            default: "请将以下文章改写成短视频脚本格式，包含画面描述和旁白文案：\n\n{content}"
          },
          writingStyles: {
            default: {
              name: "默认风格",
              tone: "专业",
              description: "清晰简洁的表达方式"
            }
          }
        }[type] || {};

        await fs.writeFile(filePath, JSON.stringify(defaultConfig, null, 2));
      }
    }
  } catch (error) {
    console.error('Error initializing config:', error);
    throw error;
  }
}

// Read configuration
async function getConfig(type) {
  if (!CONFIG_FILES[type]) {
    throw new Error(`Invalid configuration type: ${type}`);
  }

  const filePath = path.join(CONFIG_DIR, CONFIG_FILES[type]);
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
}

// Update configuration
async function updateConfig(type, key, value) {
  if (!CONFIG_FILES[type]) {
    throw new Error(`Invalid configuration type: ${type}`);
  }

  const filePath = path.join(CONFIG_DIR, CONFIG_FILES[type]);
  const data = await getConfig(type);
  data[key] = value;
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  return data;
}

// Delete configuration
async function deleteConfig(type, key) {
  if (!CONFIG_FILES[type]) {
    throw new Error(`Invalid configuration type: ${type}`);
  }

  const filePath = path.join(CONFIG_DIR, CONFIG_FILES[type]);
  const data = await getConfig(type);
  delete data[key];
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  return data;
}

module.exports = {
  initializeConfig,
  getConfig,
  updateConfig,
  deleteConfig,
  CONFIG_TYPES: Object.keys(CONFIG_FILES)
};
