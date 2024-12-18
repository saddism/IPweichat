const superagent = require('../config/superagent');
const cheerio = require('cheerio');
const { log, warn } = require('../utils');

async function getArticleContent(url) {
  try {
    log('开始获取文章内容', { url });

    const response = await superagent.req(url, 'GET', null, null);
    log('获取文章HTML成功');

    const $ = cheerio.load(response.text);

    // Extract article content from WeChat public account page
    const title = $('#activity-name').text().trim();
    const content = $('#js_content').text().trim();

    log('文章内容解析成功', {
      title,
      contentLength: content.length
    });

    return `标题：${title}\n\n正文：${content}`;
  } catch (error) {
    warn('获取文章内容失败', { error: error.message });
    throw new Error('无法获取公众号文章内容');
  }
}

module.exports = {
  getArticleContent
};
