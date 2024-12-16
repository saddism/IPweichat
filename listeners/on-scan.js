/**
 * @digest 二维码模块
 * @author Hilbert Yi
 * @time 2022-01-10
 */
const schedule = require("../schedule");
const bot = require("../bot");

let qrRefreshTimer = null;
let isRefreshing = false;

async function onScan(qrcode, status) {
  // Generate terminal QR code
  require('qrcode-terminal').generate(qrcode, {small: true});

  // Generate web QR code URL
  const qrcodeImageUrl = [
    'https://api.qrserver.com/v1/create-qr-code/?data=',
    encodeURIComponent(qrcode),
  ].join('');

  console.log('QR Code Status:', status, '\nQR Code URL:', qrcodeImageUrl);

  // Clear existing timer if any
  if (qrRefreshTimer) {
    schedule.cancelJobName('qr-refresh');
    qrRefreshTimer = null;
  }

  // Set up refresh timer if QR code is waiting for scan
  if (status === 2) { // Status 2 indicates waiting for scan
    qrRefreshTimer = schedule.setSchedule(
      'qr-refresh',
      '*/1 * * * *', // Run every minute
      async () => {
        // Prevent concurrent refresh attempts
        if (isRefreshing) {
          console.log('QR code refresh already in progress...');
          return;
        }

        console.log('QR code not scanned, generating new one...');
        isRefreshing = true;

        try {
          // Only attempt logout if we're actually logged in
          if (bot.logonoff()) {
            console.log('Logging out current session...');
            await bot.puppet.logout();
            // Wait briefly before starting new login
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Start new login attempt
          console.log('Starting new login attempt...');
          await bot.puppet.login();
        } catch (error) {
          console.error('Error refreshing QR code:', error);
          // Cancel the timer if we encounter an error
          if (qrRefreshTimer) {
            schedule.cancelJobName('qr-refresh');
            qrRefreshTimer = null;
          }
        } finally {
          isRefreshing = false;
        }
      }
    );
  }
}

module.exports = onScan;
