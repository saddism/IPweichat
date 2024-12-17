/**
 * @digest 退群
 * @author Hilbert Yi
 * @time 2022-01-10
 */
const config = require("../config");
const bot = require("../bot");

async function onRoomLeave(room, leaverList) {
  const nameList = leaverList.map(c => c.name).join(",");
  console.log(`群聊 ${room.name} 失去成员 ${nameList}`);

  const owner = room.owner;
  if (!owner) {
    console.log("room-leave-err: 无法获取群主信息");
    return;
  }

  if (owner.alias === config.MYSELF || owner.name === config.BOTNAME) {
    const master = await bot.Contact.find({ alias: config.MYSELF });
    if (master) {
      await master.say(`[${nameList}] 退出了群聊 [${room.name}]`);
    }
  }
}

module.exports = onRoomLeave;
