const ObjectId = require("mongodb").ObjectId;
const is_function = value => value && (Object.prototype.toString.call(value) === "[object Function]" || "function" === typeof value || value instanceof Function);
const fs = require("fs");
const path = require('path');

const chat = require("./chat");

module.exports = (io, client) => {
    io.on('connection', async (socket) => {
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            socket.join(user.id);
            socket.user_id = user.id;
            if (user.hide_presence) {
                if (user.presence.status !== 'offline') {
                    client.redis.call('JSON.SET', `user:${user.id}`, `$.presence.status`, '"offline"');
                    io.to(user.room.map(x => x.id)).emit('member-presence-update', { id: user.id, username: user.username, name: user.name, status: 'offline', date: Date.now() });
                }
            } else {
                if (user.presence.status !== 'online') {
                    client.redis.call('JSON.SET', `user:${user.id}`, '$.presence', `{"status":"online","date":${Date.now()}}`);
                    io.to(user.rooms.map(x => x.id)).emit('member-presence-update', { id: user.id, username: user.username, name: user.name, status: 'online', date: Date.now() });
                }
            }
            socket.on('disconnect', async () => {
                if (!io.sockets.adapter.rooms.has(user.id)) {
                    if (user.presence.type !== 'online') {
                        client.redis.call('JSON.SET', `user:${user.id}`, '$.presence', `{"status":"offline","date":${Date.now()}}`);
                        io.to(user.rooms.map(x => x.id)).emit('member-presence-update', { id: user.id, username: user.username, name: user.name, status: 'offline', date: Date.now() });
                    }
                }
            });
            
            // messaging stuff start
            chat(io, client, socket);
            // messaging stuff end

            // other stuff start
            socket.on('fr-find', async (term, callback) => {
                if (!is_function(callback)) return false;
                if (term) {
                    let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
                    if (!user) return;
                    let result = {
                        names: null,
                    };
                    let name_regex = new RegExp(term, 'i');
                    const [names] = await Promise.all([ client.database.user.find({
                        $and: [
                            { '_id': { $ne: user.id } },
                            { name: name_regex }
                        ]
                    }).sort({ 'updated_at': -1, 'created_at': -1 }).limit(10) ]);
            
                    if (names && names.length) result.names = names.map(x => {
                        let is_req_has_less_friends = user.friends.length < x.friends.length;
                        let mutual_friends = is_req_has_less_friends ? user.friends.filter(y => x.friends.includes(y)) : x.friends.filter(y => user.friends.includes(y));
                        let is_friend = user.friends.includes(x.id);
                        return {
                            id: x.id,
                            username: x.username,
                            name: x.name,
                            mutual: {
                                sample: mutual_friends.slice(0, 3),
                                count: mutual_friends.length
                            },
                            is_friend,
                        }

                    });
                    callback(result);
                }
            });
            // other stuff end

        }  else socket.emit('redirect', '/login?ref=messages');
    });
};