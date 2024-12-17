/**
 * @digest 加入群聊模块
 * @author Hilbert Yi
 * @time 2022-01-10
 */
const config = require("../config");
const bot = require("../bot");

/**
 * 处理新成员加入群聊事件
 * @param {Object} room 群聊对象
 * @param {Array} inviteeList 被邀请者列表
 * @param {Object} inviter 邀请者
 */
async function onRoomJoin(room, inviteeList, inviter) {
  const nameList = inviteeList.map(c => c.name).join(",");
  console.log(
    `群聊 ${room.name} 新增成员 ${nameList}，邀请人：${inviter.name}`
  );

  const owner = room.owner;
  if (!owner) {
    console.log("room-join-err: 无法获取群主信息");
    return;
  }

  if (owner.alias === config.MYSELF || owner.name === config.BOTNAME) {
    await room.say(`恭迎[${nameList}] 莅临本界,有劳引渡使 [${inviter.name}]`);
  }
}

module.exports = onRoomJoin;
