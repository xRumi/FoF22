const ObjectId = require("mongodb").ObjectId;
const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const redis_user = {
        get: async (id) => {
            let user = await client.redis.call('JSON.GET', `user:${id}`);
            if (user) return JSON.parse(user);
            else return false;
        },
        set: async (id, obj) => await client.redis.call('JSON.SET', `user:${id}`, '$', JSON.stringify(obj)),
    };
    client.database.functions.get_user = async ( id ) => {
        if (!id || !ObjectId.isValid(id)) return false;
        let user = await redis_user.get(id);
        if (!user) {
            user = await client.database.user.findById(id).lean();
            if (user) {
                user.id = String(user._id);
                delete user._id;
                await redis_user.set(user.id, user);
            } else return false;
        }
        if (!user.modified) user.modified = '';
        user.mark_modified = (path) => user.modified += `${path}|`;
        user.save = async (callback) => {
            await redis_user.set(user.id, user)
                .then(() => callback ? callback(false) : false)
                .catch(() => callback ? callback(true) : false);
            client.redis.sadd(`modified:users`, user.id);
        }
        return user;
    }
    client.database.functions.get_user_by_username = async ( username ) => {
        if (username?.length < 3 && username.length > 16) return false;
        let user = await client.redis.call('FT.SEARCH', 'users', `@username:${username}`, 'LIMIT', '0', '1', 'NOCONTENT');
        if (user[0]) user = await redis_user.get(user[1].split(':')[1]);
        else {
            user = await client.database.user.findOne({ username }).lean();
            if (user) {
                user.id = String(user._id);
                delete user._id;
                await redis_user.set(user.id, user);
            } else return false;
        }
        if (!user.modified) user.modified = '';
        user.mark_modified = (path) => user.modified += `${path}|`;
        user.save = async (callback) => {
            await redis_user.set(user.id, user)
                .then(() => callback ? callback(false) : false)
                .catch(() => callback ? callback(true) : false);
            client.redis.sadd(`modified:users`, user.id);
        }
        return user;
    }
    client.database.functions.get_user_by_email = async ( email ) => {
        if (!email) return false;
        if (!email.match(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i)) return false;
        let user = await client.redis.call('FT.SEARCH', 'users', `@email:'${client.esr(email)}'`, 'LIMIT', '0', '1', 'NOCONTENT');
        if (user[0]) user = await redis_user.get(user[1].split(':')[1])
        else {
            user = await client.database.user.findOne({ email }).lean();
            if (user) {
                user.id = String(user._id);
                delete user._id;
                await redis_user.set(user.id, user);
            } else return false;
        }
        if (!user.modified) user.modified = '';
        user.mark_modified = (path) => user.modified += `${path}|`;
        user.save = async (callback) => {
            await redis_user.set(user.id, user)
                .then(() => callback ? callback(false) : false)
                .catch(() => callback ? callback(true) : false);
            client.redis.sadd(`modified:users`, user.id);
        }
        return user;
    }
    client.database.functions.create_user = async ( username, email, password, name) => {
        let user = await client.database.functions.get_user_by_username(username);
        if (user) return false;
        else try {
            user = new client.database.user({ username, email, password, name });
            await user.save();
            user = user.toObject();
            user.id = String(user._id);
            delete user._id;
            await redis_user.set(user.id, user);
            if (!user.modified) user.modified = '';
            user.mark_modified = (path) => user.modified += `${path}|`;
            user.save = async (callback) => {
                await redis_user.set(user.id, user)
                    .then(() => callback ? callback(false) : false)
                    .catch(() => callback ? callback(true) : false);
                client.redis.sadd(`modified:users`, user.id);
            }
            return user;
        } catch (err) {
            console.log(err);
            return false;
        }
    }
    client.database.functions.delete_user = async ( id ) => {
        if (!id || !ObjectId.isValid(id)) return false;
        let user = await client.database.user.findById(id);
        if (user) {
            user = {
                username: user.username,
                email: user.email,
                deleted_at: Date.now()
            };
            await user.save();
            redis_user.set(user.id, user.toObject());
            return true;
        } else return false;
    }
    // room database functions
    const redis_room = {
        get: async (id) => {
            let user = await client.redis.call('JSON.GET', `room:${id}`);
            if (user) return JSON.parse(user);
            else return false;
        },
        set: async (id, obj) => await client.redis.call('JSON.SET', `room:${id}`, '$', JSON.stringify(obj)),
    };
    const redis_chat = {
        get: async (id) => {
            let user = await client.redis.call('JSON.GET', `chat:${id}`);
            if (user) return JSON.parse(user);
            else return false;
        },
        set: async (id, obj) => await client.redis.call('JSON.SET', `chat:${id}`, '$', JSON.stringify(obj)),
    };
    client.database.functions.create_room = async ( name, members, _u, type = 'private' ) => {
        let room = new client.database.room({ name, members, type });
        let chat = new client.database.chat({ room_id: room.id });
        room.chat_id = chat.id;
        fs.mkdirSync(path.join(__dirname, `/../public/uploads/rooms/${room.id}`), { recursive: true }, err => console.log(err));
        await room.save();
        await chat.save();
        if (_u) {
            let user = await client.database.functions.get_user(_u);
            user.rooms.push({
                id: room.id
            });
            await user.save();
        } else {
            Promise.all(members.map(id => client.database.users.get_user(id))).then(users => {
                Promise.all(users.map(user => {
                    user.rooms.push({
                        id: room.id
                    });
                    return user.save();
                }));
            });
        }
        room = room.toObject(); room.id = String(room._id); delete room._id;
        chat = chat.toObject(); chat.id = String(chat._id); delete chat._id;
        redis_room.set(room.id, room);
        redis_chat.set(chat.id, chat);
        if (!room.modified) room.modified = '';
        room.mark_modified = (path) => room.modified += `${path}|`;
        room.save = async (callback) => {
            await redis_room.set(room.id, room)
                .then(() => callback ? callback(false) : false)
                .catch(() => callback ? callback(true) : false);
            client.redis.sadd(`modified:rooms`, room.id);
        }
        if (!chat.modified) chat.modified = '';
        chat.mark_modified = (path) => chat.modified += `${path}|`;
        chat.save = async (callback) => {
            await redis_chat.set(chat.id, chat)
                .then(() => callback ? callback(false) : false)
                .catch(() => callback ? callback(true) : false);
            client.redis.sadd(`modified:chats`, chat.id);
        }
        return room;
    }
    client.database.functions.get_room = async ( id ) => {
        if (!id || !ObjectId.isValid(id)) return false;
        let room = await redis_room.get(id);
        if (!room) {
            room = await client.database.room.findById(id).lean();
            if (room) {
                room.id = String(room._id);
                delete room._id;
                await redis_room.set(room.id, room);
            } else return false;
        }
        if (!room.modified) room.modified = '';
        room.mark_modified = (path) => room.modified += `${path}|`;
        room.save = async (callback) => {
            await redis_room.set(room.id, room)
                .then(() => callback ? callback(false) : false)
                .catch(() => callback ? callback(true) : false);
            client.redis.sadd(`modified:rooms`, room.id);
        }
        return room; 
    }
    client.database.functions.get_chat = async ( id ) => {
        if (!id || !ObjectId.isValid(id)) return false;
        let chat = await redis_chat.get(id);
        if (!chat) {
            chat = await client.database.chat.findById(id).lean();
            if (chat) {
                chat.id = String(chat._id);
                delete chat._id;
                await redis_chat.set(chat.id, chat);
            } else return false;
        }
        if (!chat.modified) chat.modified = '';
        chat.mark_modified = (path) => chat.modified += `${path}|`;
        chat.save = async (callback) => {
            await redis_chat.set(chat.id, chat)
                .then(() => callback ? callback(false) : false)
                .catch(() => callback ? callback(true) : false);
            client.redis.sadd(`modified:chats`, chat.id);
        }
        return chat;
    }
    client.database.functions.delete_messages = async ( id ) => {
        if (!id || !ObjectId.isValid(id)) return false;
        let chat = await client.database.functions.get_chat(id);
        if (chat) {
            chat.messages = [];
            chat.modified += `messages|`
            await chat.save();
            return true;
        } else return false;
    }
    // token
    const redis_token = {
        get: async (id) => {
            let user = await client.redis.call('JSON.GET', `token:${id}`);
            if (user) return JSON.parse(user);
            else return false;
        },
        set: async (id, obj) => await client.redis.call('JSON.SET', `token:${id}`, '$', JSON.stringify(obj)),
    };
    client.database.functions.create_token = async ( user_id, type = 'reset-token', expire_at = Date.now() + 24 * 60 * 60 * 1000 ) => {
        let token = await client.database.token.findOne({ user_id, type });
        if (token) return token;
        else {
            token = new client.database.token({ user_id, token });
            await token.save();
            return token;
        }
    }
    // session
    client.database.functions.delete_all_sessions = async ( id ) => {
        client.redis.smembers(`sessions:${id}`, async (err, ids) => {
            if (err) return false;
            else if (ids.length) {
                await client.redis.del.apply(client.redis, ids.map(x => `session:${x}`));
                await client.redis.del(`sessions:${id}`);
                return true;
            } else return true;
        });
    }
}
