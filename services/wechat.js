const axios = require('axios');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');
const { log, warn } = require('../utils');

class WeChatClient extends EventEmitter {
  constructor() {
    super();
    this.isLoggedIn = false;
    this.contacts = new Map();
    this.rooms = new Map();
    this.messageHistory = new Set();
    this.Message = {
      Type: {
        Text: 'text',
        Image: 'image',
        Url: 'url'
      }
    };
  }

  async login() {
    try {
      // Generate QR code for login
      const qrCode = await this._getLoginQRCode();
      this.emit('scan', qrCode);

      // Wait for scan and login
      await this._waitForLogin();

      this.isLoggedIn = true;
      this.emit('login', this.userInfo);

      // Start message polling
      this._startMessagePolling();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async handleMessage(callback) {
    this.on('message', callback);
  }

  async sendMessage(to, content) {
    if (!this.isLoggedIn) {
      throw new Error('Not logged in');
    }

    try {
      // Send message implementation
      await this._sendMessageToUser(to, content);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async sendRoomMessage(roomId, content, mentions = []) {
    if (!this.isLoggedIn) {
      throw new Error('Not logged in');
    }

    try {
      // Send group message implementation
      await this._sendMessageToRoom(roomId, content, mentions);
    } catch (error) {
      console.error('Failed to send room message:', error);
      throw error;
    }
  }

  // Message type helpers
  Message = {
    Type: {
      Text: 'text',
      Image: 'image',
      Url: 'url'
    }
  };

  Contact = {
    Type: {
      Individual: 'individual',
      Official: 'official'
    }
  };

  // Private methods for WeChat Web API integration
  async _getLoginQRCode() {
    try {
      log('正在获取登录二维码...');
      const response = await axios.get('https://login.wx.qq.com/jslogin', {
        params: {
          appid: 'wx782c26e4c19acffb',
          fun: 'new',
          lang: 'zh_CN',
          _: Date.now()
        }
      });

      if (!response.data) {
        throw new Error('获取二维码失败：服务器无响应');
      }

      const match = response.data.match(/window.QRLogin.code = (\d+); window.QRLogin.uuid = "(\S+?)"/);
      if (!match) {
        throw new Error('获取二维码失败：解析响应失败');
      }

      const [, code, uuid] = match;
      if (code !== '200') {
        throw new Error(`获取二维码失败：错误代码 ${code}`);
      }

      log('生成登录二维码...');
      qrcode.generate(`https://login.weixin.qq.com/l/${uuid}`, {
        small: true
      });

      // Generate backup QR code URL
      const backupUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(uuid)}`;
      log(`备用二维码链接: ${backupUrl}`);

      return uuid;
    } catch (error) {
      warn('获取二维码出错: ' + error.message);
      throw error;
    }
  }

  async _waitForLogin(uuid) {
    const checkLogin = async () => {
      try {
        log('正在等待扫码...');
        const response = await axios.get('https://login.wx.qq.com/cgi-bin/mmwebwx-bin/login', {
          params: {
            loginicon: true,
            uuid: uuid,
            tip: 1,
            r: ~new Date(),
            _: Date.now()
          }
        });

        const code = response.data.match(/window.code=(\d+)/)[1];

        switch (code) {
          case '201':
            log('扫描成功，请在手机上确认');
            return { code, redirectUrl: null };
          case '200':
            const redirectUrl = response.data.match(/window.redirect_uri="(.+?)"/)[1];
            log('登录成功，正在处理登录信息...');
            return { code, redirectUrl };
          case '408':
            warn('登录超时，请重新扫码');
            return { code, redirectUrl: null };
          default:
            return { code, redirectUrl: null };
        }
      } catch (error) {
        warn('等待登录出错: ' + error.message);
        throw error;
      }
    };

    while (true) {
      const { code, redirectUrl } = await checkLogin();
      if (code === '200' && redirectUrl) {
        await this._login(redirectUrl);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  async _login(redirectUrl) {
    try {
      log('开始处理登录重定向...');
      const response = await axios.get(redirectUrl + '&fun=new&version=v2');
      const baseUrl = redirectUrl.match(/^https:\/\/.+?\/$/)[0];
      this.baseUrl = baseUrl;
      this.cookie = response.headers['set-cookie'].join('; ');
      log('成功获取登录Cookie');

      // Parse XML response to get user info
      this.userInfo = this._parseLoginInfo(response.data);
      this.isLoggedIn = true;
      console.log(`登录成功！用户昵称: ${this.userInfo.name}`);
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  _parseLoginInfo(xmlData) {
    try {
      return {
        name: xmlData.match(/<NickName>(.+?)<\/NickName>/)[1],
        id: xmlData.match(/<UserName>(.+?)<\/UserName>/)[1],
        skey: xmlData.match(/<Skey>(.+?)<\/Skey>/)[1],
        wxsid: xmlData.match(/<wxsid>(.+?)<\/wxsid>/)[1],
        wxuin: xmlData.match(/<wxuin>(.+?)<\/wxuin>/)[1],
        pass_ticket: xmlData.match(/<pass_ticket>(.+?)<\/pass_ticket>/)[1]
      };
    } catch (error) {
      console.error('Failed to parse login info:', error);
      throw new Error('Invalid login response format');
    }
  }

  async _startMessagePolling() {
    try {
      log('开始消息轮询...');
      while (this.isLoggedIn) {
        const messages = await this._fetchNewMessages();
        if (messages && messages.length > 0) {
          log(`收到 ${messages.length} 条新消息`);
          for (const msg of messages) {
            if (!this.messageHistory.has(msg.id)) {
              this.messageHistory.add(msg.id);
              const formattedMsg = this._formatMessage(msg);
              log(`处理消息 - 类型: ${formattedMsg.type}, 发送者: ${formattedMsg.talker().name()}, 内容: ${formattedMsg.text}`);
              this.emit('message', formattedMsg);
            }
          }
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      warn('消息轮询出错: ' + error.message);
      this.isLoggedIn = false;
      this.emit('logout');
    }
  }

  async _fetchNewMessages() {
    if (!this.isLoggedIn) return [];

    try {
      const response = await axios.post(`${this.baseUrl}webwxsync`, {
        BaseRequest: {
          Uin: this.userInfo.wxuin,
          Sid: this.userInfo.wxsid,
          Skey: this.userInfo.skey,
          DeviceID: `e${Math.random().toString().slice(2, 17)}`
        },
        SyncKey: this.syncKey,
        rr: ~new Date()
      }, {
        headers: {
          Cookie: this.cookie,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.BaseResponse.Ret !== 0) {
        throw new Error(`Sync failed with ret code ${response.data.BaseResponse.Ret}`);
      }

      this.syncKey = response.data.SyncKey;
      return response.data.AddMsgList || [];
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  async _sendMessageToUser(userId, content) {
    // Implementation to send message to user
  }

  async _sendMessageToRoom(roomId, content, mentions) {
    // Implementation to send message to room
  }

  _formatMessage(msg) {
    return {
      id: msg.id,
      type: msg.type,
      text: msg.content,
      room: msg.roomId ? {
        id: msg.roomId,
        topic: this.rooms.get(msg.roomId)?.name
      } : null,
      talker: () => ({
        name: () => msg.sender.name,
        alias: () => msg.sender.alias,
        type: () => msg.sender.type
      }),
      self: () => msg.sender.id === this.userInfo.id,
      age: () => (Date.now() - msg.timestamp) / 1000
    };
  }
}

module.exports = new WeChatClient();
