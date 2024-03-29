require('dotenv').config();
const mongoose = require("mongoose"),
    Redis = require("ioredis"),
    redis = new Redis(process.env.REDIS_CLOUD ? {
        port: process.env.REDIS_CLOUD_PORT,
        host: process.env.REDIS_CLOUD_HOST,
        username: process.env.REDIS_CLOUD_USERNAME,
        password: process.env.REDIS_CLOUD_PASSWORD
    } : {});

const User = require("./models/User"),
    Room = require("./models/Room"),
    Chat = require("./models/Chat");

const promot_opt = 
    `----------------------------------------------------\n` +
    `|    Type [help] to show this message              |\n` +
    `|    Type [clear] to clear console                 |\n` +
    `|    Type [sync] to force sync                     |\n` +
    `|    Type [start] to start force stopped sync      |\n` +
    `|    Type [stop] to force stop sync                |\n` +
    `|    Type [clear-cache <db>] to clear redis cache  |\n` +
    `|    Type [redis <command>] to run redis command   |\n` +
    `|    Type [reset] to reset redis db                |\n` +
    `|    Type [js <code>] to run javascript code       |\n` +
    `----------------------------------------------------\n` +
    `> `;

let sync_interval, reset, db_connected;

process.stdin.on('data', async data => {
    if (!db_connected) return;
    let input = data.toString().trim();
    if (reset) {
        if (input == 'yes') {
            await redis.call('FLUSHALL')
                .then(() => console.log('[Redis] done, restart the both this and main application'))
                .catch(err => console.log(`[Redis] error reset ${err}`));
        } else {
            console.log('[Sync] reset cancelled');
            reset = false;
        } process.stdout.write('\n> ');
    } else if (input == 'sync') sync(true);
    else if (input == 'clear') { console.clear(); process.stdout.write(promot_opt); }
    else if (input == 'start') {
        if (!sync_interval) {
            console.log('[Sync] started');
            sync_interval = setInterval(() => sync, 5000);
        } else console.log('[Sync] already started');
        process.stdout.write('\n> ');
    } else if (input == 'stop') {
        if (sync_interval) {
            console.log('[Sync] forced stopped');
            clearInterval(sync_interval);
            sync_interval = false;
        } else console.log('[Sync] already stopped');
        process.stdout.write('\n> ');
    } else if (input.split(' ')[0] == 'clear-cache') {
        let input2 = input.split(' ')[1];
        if (input2) {
            if (input2 == 'user') await redis.del(await redis.keys('user:*')).then(() => console.log('[Redis] user cache cleared')).catch(() => {});
            else if (input2 == 'room') await redis.del(await redis.keys('room:*')).then(() => console.log('[Redis] room cache cleared')).catch(() => {});
            else if (input2 == 'chat') await redis.del(await redis.keys('chat:*')).then(() => console.log('[Redis] chat cache cleared')).catch(() => {});
            else return console.log('[Sync] invaild cache db provided');
        } else {
            await redis.del(await redis.keys('user:*')).then(() => console.log('[Redis] user cache cleared')).catch(() => {});
            await redis.del(await redis.keys('room:*')).then(() => console.log('[Redis] room cache cleared')).catch(() => {});
            await redis.del(await redis.keys('chat:*')).then(() => console.log('[Redis] chat cache cleared')).catch(() => {});
        }
        console.log('[Sync] done'); process.stdout.write('\n> ');
    } else if (input == 'reset') {
        console.log('[Sync] are you sure? it will break the main application. type [yes] to reset');
        reset = true; process.stdout.write('\n> ');
    } else if (input.split(' ')[0] == 'redis') {
        let command = input.replace(/[',]/g, "").split(' ').slice(1);
        try { await redis.call(...command).then(console.log).catch(console.log);
        } catch (err) { console.log(err); } process.stdout.write('\n> ');
    } else if (input == 'help') process.stdout.write(promot_opt);
    else if (input.split(' ')[0] == 'js') (new Promise((resolve) => resolve(eval(input.split(' ').slice(1).join(' ')))))
        .then(x => { console.log(x); process.stdout.write('\n> '); })
        .catch(x => { console.log(x); process.stdout.write('\n> '); });
    else { console.log(`[Sync] command not found`); process.stdout.write('\n> '); }
});

redis.on('connect', async () => {
    console.log('[Redis] connected');
    mongoose.connect(process.env.DEV ? process.env.MONGODB_URL_DEV : process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(async () => {
            console.log('[MongoDB] connected'); db_connected = true;
            await redis.call('FT.INFO', 'users').catch(() => redis.call(
                'FT.CREATE', 'users', 'ON', 'JSON',
                'PREFIX', '1', 'user:', 'SCHEMA',
                '$.username', 'AS', 'username', 'TEXT',
                '$.email', 'AS', 'email', 'TEXT')
                .then(() => console.log('[Redis] users query index created'))
                .catch(err => console.log(`[Redis] ${err}`)));
            sync_interval = setInterval(sync, 5 * 60 * 1000);
            process.stdout.write(promot_opt);
        }).catch((err) => {
            console.log(err);
            console.log(
                '----------------------------------------------------\n' +
                '|    [Sync] mongodb is required, try again later   |\n' +
                `----------------------------------------------------`);
            process.exit();
        });
}).on('error', err => {
    console.log(err);
    console.log(
        '----------------------------------------------------\n' +
        '|    [Sync] redis is required, try again later   |\n' +
        `----------------------------------------------------`);
    process.exit();
});

async function sync(force) {
    if (force) { console.log('[Sync] forced sync triggered'); process.stdout.write('\n> '); }
    let users = await redis.smembers('modified:users');
    if (users && users.length) Promise.all(users.map(async _id => {
        let user_raw = await redis.call('JSON.GET', `user:${_id}`); if (!user_raw) return false;
        let _user = JSON.parse(user_raw); let modified = _user.modified?.split('|').filter(x => x);
        if (modified && modified.length) {
            let user = await User.findById(_id);
            if (!user) return false;
            for (let i = 0; i < modified.length; i++) {
                let path = modified[i].split(/(\[.*])/).filter(x => x).map(x => x.includes('[') ? x : `['${x}']`);
                if (path.length) {
                    eval(`user${path.join('')} = _user${path.join('')};`);
                    user.markModified(modified[i].split('[')[0]);
                }
            }
            await redis.call('SREM', 'modified:users', _id);
            await redis.call('JSON.SET', `user:${_id}`, '$.modified', `"|"`);
            return user.save();
        } else return false;
    }));
    let rooms = await redis.smembers('modified:rooms');
    if (rooms && rooms.length) Promise.all(rooms.map(async _id => {
        let room_raw = await redis.call('JSON.GET', `room:${_id}`); if (!room_raw) return false;
        let _room = JSON.parse(room_raw); let modified = _room.modified?.split('|').filter(x => x);
        if (modified && modified.length) {
            let room = await Room.findById(_id);
            if (!room) return false;
            for (let i = 0; i < modified.length; i++) {
                let path = modified[i].split(/(\[.*])/).filter(x => x).map(x => x.includes('[') ? x : `['${x}']`);
                if (path.length) {
                    eval(`room${path.join('')} = _room${path.join('')};`);
                    room.markModified(modified[i].split('[')[0]);
                }
            }
            await redis.call('SREM', 'modified:rooms', _id);
            await redis.call('JSON.SET', `room:${_id}`, '$.modified', `"|"`);
            return room.save();
        } else return false;
    }));
    let chats = await redis.smembers('modified:chats');
    if (chats && chats.length) Promise.all(chats.map(async _id => {
        let chat_raw = await redis.call('JSON.GET', `chat:${_id}`); if (!chat_raw) return false;
        let _chat = JSON.parse(chat_raw); let modified = [...new Set(_chat.modified?.split('|').filter(x => x))];
        if (modified && modified.length) {
            let chat = await Chat.findById(_id);
            if (!chat) return false;
            for (let i = 0; i < modified.length; i++) {
                let path = modified[i].split(/(\[.*])/).filter(x => x).map(x => x.includes('[') ? x : `['${x}']`);
                if (path.length) {
                    eval(`chat${path.join('')} = _chat${path.join('')};`);
                    chat.markModified(modified[i].split('[')[0]);
                }
            }
            await redis.call('SREM', 'modified:chats', _id);
            await redis.call('JSON.SET', `chat:${_id}`, '$.modified', `"|"`);
            return chat.save();
        } else return false;
    }));
}
