/**
 * @digest 二维码模块
 * @time 2022-01-10
 */
const qrcodeTerminal = require('qrcode-terminal');

/**
 * @func 处理登录二维码
 * @param {string} qrcode 二维码内容
 */
async function onScan(qrcode) {
  // Generate QR code in terminal
  qrcodeTerminal.generate(qrcode, { small: true });

  // Generate backup QR code URL
  const qrcodeImageUrl = [
    'https://api.qrserver.com/v1/create-qr-code/?data=',
    encodeURIComponent(qrcode),
  ].join('');

  console.log('请扫描二维码登录微信');
  console.log('备用二维码链接:', qrcodeImageUrl);
}

module.exports = onScan;
