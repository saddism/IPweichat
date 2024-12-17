/**
 * @digest utils工具
 * @digest utils工具
 * @time 2022-01-11
 */

const moment = require('./moment');
const fs = require('fs');
const path = require('path');

/**
 * rgb转hex
 * @param color rgb颜色值
 */
function colorRGBtoHex(color) {
    var rgb = color.split(',');
    var r = parseInt(rgb[0].split('(')[1]);
    var g = parseInt(rgb[1]);
    var b = parseInt(rgb[2].split(')')[0]);
    var hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    return hex;
}
/**
 * hex转rgb
 * @param color 16进制颜色值
 */
function colorHextoRGB(color) {
    // 16进制颜色值的正则
    var reg = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    // 把颜色值变成小写
    if (reg.test(color)) {
        // 如果只有三位的值，需变成六位，如：#fff => #ffffff
        if (color.length === 4) {
            var colorNew = "#";
            for (var i = 1; i < 4; i += 1) {
                colorNew += color.slice(i, i + 1).concat(color.slice(i, i + 1));
            }
            color = colorNew;
        }
        // 处理六位的颜色值，转为RGB
        var colorChange = [];
        for (var i = 1; i < 7; i += 2) {
            colorChange.push(parseInt("0x" + color.slice(i, i + 2)));
        }
        return "rgb(" + colorChange.join(",") + ")";
    } else {
        return color;
    }
}

function timestamp() {
    const stamp = moment().format('M-DD HH:mm:ss');
    return stamp;
}

/**
 * Write log message to file
 * @param {string} message Log message
 * @param {string} type Log type (info/warn)
 */
function writeToLog(message, type = 'info') {
    const logDir = path.join(__dirname, '../logs');
    const today = moment().format('YYYY-MM-DD');
    const logFile = path.join(logDir, `${today}.log`);
    const logMessage = `[${type.toUpperCase()}] ${timestamp()} ${message}\n`;

    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (error) {
        console.error(`Failed to write to log file: ${error.message}`);
    }
}

/**
 * @func log方法重载,带时间戳
 * @param {string} content
 */
function log(content) {
    const loginfo = `${timestamp()} ${content}`;
    console.log(loginfo);
    writeToLog(content, 'info');
}

function warn(content) {
    const warninfo = `${timestamp()} ${content}`;
    console.warn(warninfo);
    writeToLog(content, 'warn');
}

module.exports = {
    colorRGBtoHex,
    colorHextoRGB,
    log, warn,
}
