/*
 * @Author: Yi Zhihang
 * @Create: 2022-02-24 15:22:22
 * @LastEditTime: 2022-04-02 18:29:56
 * @Description: 指令正则表达式
 */
module.exports = {
    // map name detail
    IN_CODEBOOK: /^map\s\S+\s\S+(\s[\w]{16}\s[\w]{16})?$/,
    // get name
    OUT_CODEBOOK: /^get\s\S+(\s[\w]{16}\s[\w]{16})?$/,
    // 定时 月.日[.时.分.秒] 目标联系人 消息内容
    TIMING: /^定时\s[0-9]{1,2}\.[0-9]{1,2}\s[0-9]{1,2}\.?[0-9]{0,2}\.?[0-9]{0,2}\s\S+\s\S+$/,
    // 群发 月.日[.时.分.秒] 联系人列表 消息内容
    TIMINGS: /^群发\s[0-9]{1,2}\.[0-9]{1,2}\s[0-9]{1,2}\.?[0-9]{0,2}\.?[0-9]{0,2}\s(\S+，?)\s\S+$/,
    // 销毁 任务id
    CANCEL: /^销毁\s[0-9]{10,11}$/,
    URL: /(http(s)?:\/\/)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:[0-9]{1,5})?[-a-zA-Z0-9()@:%_\\\+\.~#?&//=]*$/g,
    IGNORE: /^屏蔽\s\S.+/,
    UN_IGNORE: /^解除屏蔽\s\S.+/,
    // 翻译 [from] [to] 文本
    TRANSLATE: /^翻译\s(\S+.?)+$/,
    // 改写短视频指令
    REWRITE_VIDEO: /^@\S+\s改写(短视频)?$/,
    // 公众号文章链接
    WECHAT_ARTICLE: /^https?:\/\/mp\.weixin\.qq\.com\/s\/.+$/,
}
