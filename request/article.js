const superagent = require('../config/superagent');
const cheerio = require('cheerio');

async function getArticleContent(url) {
  try {
    const response = await superagent.get(url);
    const $ = cheerio.load(response.text);

    // Extract article content from WeChat public account page
    const title = $('#activity-name').text().trim();
    const content = $('#js_content').text().trim();

    return `标题：${title}\n\n正文：${content}`;
  } catch (error) {
    console.error('Error fetching article:', error);
    throw new Error('无法获取公众号文章内容');
  }
}

module.exports = {
  getArticleContent
};
