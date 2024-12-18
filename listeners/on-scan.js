/**
 * @digest 二维码模块
 * @time 2022-01-10
 */
const qrcodeTerminal = require('qrcode-terminal');
const util = require('../utils');

let lastQRTimestamp = 0;
let qrCheckInterval = null;

/**
 * @func 生成新的二维码
 * @param {object} bot Wechaty实例
 */
async function regenerateQR(bot) {
  try {
    util.log('二维码已过期，正在重新生成...');
    // Clear current session state and request new QR code
    bot.state.currentUUID = null;
    bot.state.isLoggedIn = false;
    await bot._generateAndEmitQRCode();
  } catch (error) {
    const errorMessage = error.message || '未知错误';
    util.warn('重新生成二维码失败: ' + errorMessage);
  }
}

/**
 * @func 处理登录二维码
 * @param {string} qrcode 二维码内容
 * @param {number} status 扫码状态
 * @param {object} bot Wechaty实例
 */
async function onScan(qrcode, status, bot) {
  util.log('正在获取登录二维码...');

  // Generate QR code in terminal
  qrcodeTerminal.generate(qrcode, { small: true });

  // Update timestamp for this QR code
  lastQRTimestamp = Date.now();

  // Set up auto-regeneration check if not already running
  if (!qrCheckInterval) {
    qrCheckInterval = setInterval(() => {
      const qrAge = (Date.now() - lastQRTimestamp) / 1000;
      if (qrAge >= 60) { // 1 minute
        regenerateQR(bot);
        clearInterval(qrCheckInterval);
        qrCheckInterval = null;
      }
    }, 5000); // Check every 5 seconds
  }

  // Log scan status
  switch(status) {
    case 0:
      util.log('正在等待扫码...');
      break;
    case 1:
      util.log('已扫码，等待确认...');
      clearInterval(qrCheckInterval);
      qrCheckInterval = null;
      break;
    case 2:
      util.log('已确认，正在登录...');
      clearInterval(qrCheckInterval);
      qrCheckInterval = null;
      break;
    case 3:
      util.warn('二维码已过期');
      await regenerateQR(bot);
      break;
    default:
      util.warn('未知的扫码状态:', status);
  }
}

module.exports = onScan;
