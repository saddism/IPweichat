/**
 * @digest 入口文件
 */
const wechat = require('./services/wechat');
const config = require('./config');

const bot = {
  Message: wechat.Message,
  Contact: wechat.Contact,
  Room: wechat.Room,

  async start() {
    return wechat.login();
  },

  on(event, callback) {
    return wechat.on(event, callback);
  },

  Contact: {
    find: async (query) => {
      const contacts = wechat.contacts;
      if (query.name) {
        return Array.from(contacts.values()).find(c => c.name === query.name);
      } else if (query.alias) {
        return Array.from(contacts.values()).find(c => c.alias === query.alias);
      }
      return null;
    },
    findAll: async () => {
      return Array.from(wechat.contacts.values());
    }
  },

  Room: {
    find: async (query) => {
      const rooms = wechat.rooms;
      if (query.topic) {
        return Array.from(rooms.values()).find(r => r.name === query.topic);
      }
      return null;
    }
  }
};

module.exports = bot;
