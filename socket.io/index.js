const ObjectId = require("mongodb").ObjectId;
const is_function = value => value && (Object.prototype.toString.call(value) === "[object Function]" || "function" === typeof value || value instanceof Function);
const fs = require("fs");
const path = require('path');

const chat = require("./chat");

module.exports = (io, client) => {
    io.on('connection', async (socket) => {
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        console.log("user " + user.username + " connected");
        if (user) {
            socket.join(user.id);
            socket.user_id = user.id;
            let presence_ack_interval;
            if (user.hide_presence) {
                if (user.presence.status !== 'offline') {
                    client.redis.call('JSON.SET', `user:${user.id}`, `$.presence.status`, '"offline"');
                    io.to(user.rooms.map(x => x.id)).emit('member-presence-update', { id: user.id, status: 'offline', date: Date.now() });
                    io.to(user.friends).emit('room-presence-update', { id: user.id, status: 'offline', date: Date.now() });
                }
            } else {
                if (user.presence.status !== 'online') {
                    client.redis.call('JSON.SET', `user:${user.id}`, '$.presence', `{"status":"online","date":${Date.now()}}`);
                    io.to(user.rooms.map(x => x.id)).emit('member-presence-update', { id: user.id, status: 'online', date: Date.now() });
                    io.to(user.friends).emit('room-presence-update', { id: user.id, status: 'online', date: Date.now() });
                    presence_ack_interval = setInterval(async () => {
                        user = await client.database.functions.get_user(socket.request.session?.passport?.user);
                        if (user.hide_presence) {
                            if (user.presence.status !== 'offline') {
                                user.presence.status = 'offline';
                                client.redis.call('JSON.SET', `user:${user.id}`, `$.presence.status`, '"offline"');
                                io.to(user.rooms.map(x => x.id)).emit('member-presence-update', { id: user.id, status: 'offline', date: Date.now() });
                                io.to(user.friends).emit('room-presence-update', { id: user.id, status: 'offline', date: Date.now() });
                            }
                        } else {
                            let presence_ack_timeout = setTimeout(() => {
                                if (user.presence.status !== 'offline') {
                                    user.presence.status = 'offline';
                                    client.redis.call('JSON.SET', `user:${user.id}`, `$.presence.status`, '"offline"');
                                    io.to(user.rooms.map(x => x.id)).emit('member-presence-update', { id: user.id, status: 'offline', date: Date.now() });
                                    io.to(user.friends).emit('room-presence-update', { id: user.id, status: 'offline', date: Date.now() });
                                    // console.log("forceful disconnect");
                                    // socket.disconnect();
                                }
                            }, 60 * 1000);
                            socket.emit('member-presence-ack', callback => {
                                clearTimeout(presence_ack_timeout);
                                if (user.presence.status !== 'online') {
                                    user.presence.status = 'online';
                                    client.redis.call('JSON.SET', `user:${user.id}`, '$.presence', `{"status":"online","date":${Date.now()}}`);
                                    io.to(user.rooms.map(x => x.id)).emit('member-presence-update', { id: user.id, status: 'online', date: Date.now() });
                                    io.to(user.friends).emit('room-presence-update', { id: user.id, status: 'online', date: Date.now() });
                                }
                            });
                        }
                    }, 60 * 1000);
                }
            }
            socket.on('disconnect', async () => {
                console.log(`user ${user.username} disconnect`);
                if (!io.sockets.adapter.rooms.has(user.id)) {
                    console.log(`no other user ${user.username} connected`);
                    if (user.presence.type !== 'offline') {
                        user.presence.status = 'offline';
                        client.redis.call('JSON.SET', `user:${user.id}`, '$.presence', `{"status":"offline","date":${Date.now()}}`);
                        io.to(user.rooms.map(x => x.id)).emit('member-presence-update', { id: user.id, status: 'offline', date: Date.now() });
                        io.to(user.friends).emit('room-presence-update', { id: user.id, status: 'offline', date: Date.now() });
                    }
                }
                clearInterval(presence_ack_interval);
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
                    if (term.length > 20) return;
                    let result = {
                        names: null,
                    };
                    let name_regex = new RegExp(term.replace(/[^A-Za-z0-9 ]/g, ''), 'i');
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
        } else socket.emit('redirect', '/login?back_to=/spa/messages');
    });
};
