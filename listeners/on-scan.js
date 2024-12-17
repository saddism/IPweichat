import QRCode from 'qrcode';
import { ScanStatus } from 'wechaty';
import util from '../utils/index.js';

export async function onScan(qrcode, status) {
  try {
    if (qrcode) {
      console.log(await QRCode.toString(qrcode, { type: 'terminal', small: true }));

      const qrcodeImageUrl = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`;

      switch (status) {
        case ScanStatus.Waiting:
          util.log('Waiting for scan');
          break;
        case ScanStatus.Scanned:
          util.log('Scanned, please confirm on phone');
          break;
        case ScanStatus.Confirmed:
          util.log('Login confirmed');
          break;
        case ScanStatus.Timeout:
          util.warn('QR code expired, please refresh');
          break;
        default:
          util.log(`Unknown status: ${status}`);
      }

      console.log('QR Code URL:', qrcodeImageUrl);
    } else {
      util.warn('No QR code received from Wechaty');
    }
  } catch (error) {
    util.error(`QR code generation failed: ${error.message}`);
  }
}

export default onScan;
