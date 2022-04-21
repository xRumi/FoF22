const ObjectId = require("mongodb").ObjectId;

module.exports.sockets = (io, client) => {
    io.on('connection', async (socket) => {
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            socket.join(user.id);
            socket.user_id = user.id;
            client.cache.functions.update_user({ username: user.username, status: 'online' });
            socket.on('autocomplete', async (term, callback) => {
                if (term) {
                    let result = {
                        names: null,
                    };
                    let name_regex = new RegExp(term, 'i');
                    const [names] = await Promise.all([ client.database.user.find({ name: name_regex }).sort({ 'updated_at': -1, 'created_at': -1 }).limit(10) ]);
            
                    if (names && names.length) result.names = names.map(x => ({
                        id: x.id,
                        username: x.username,
                        name: x.name
                    }));
                    callback(result);
                }
            });
            socket.on('create-or-join-room', async (user_id, callback) => {
                if (!callback && typeof callback !== 'function') return false;
                let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
                let _user = await client.database.functions.get_user(user_id);
                if (user && _user && _user.id !== user.id) {
                    let room_exists = await client.database.room.findOne({ members: { $all: [user.id, _user.id], $size: 2 } });
                    if (room_exists) {
                        if (!user.rooms.includes(room_exists.id)) {
                            user.rooms.push(room_exists.id);
                            await user.save();
                        }
                        if (!_user.rooms.includes(room_exists.id)) {
                            _user.rooms.push(room_exists.id);
                            await _user.save();
                        }
                        callback(room_exists.id);
                    } else {
                        let room = await client.database.functions.create_room(`${user.username}.${_user.username}`, [user.id, _user.id], user.id);
                        if (room) callback(room.id);
                        else callback(null);
                    }
                }
            });
            socket.on('join-room', async (id, callback) => {
                if (!callback && typeof callback !== 'function') return false;
                let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
                if (user && user.id == socket.user_id && id) {
                    if (ObjectId.isValid(id)) {
                        const room = await client.database.functions.get_room(id);
                        if (room) {
                            const chat = await client.database.chat.findById(room.chat_id);
                            if (chat) {
                                if (socket.room_id != room.id) {
                                    socket.leave(socket.room_id);
                                    socket.join(room.id);
                                    socket.room_id = room.id;
                                    socket.chat_id = room.chat_id;
                                }
                                let name;
                                if (room.type == 'private') {
                                    if (room.members[0] == user.id) {
                                        let _friend = await client.database.functions.get_user(room.members[1]);
                                        if (_friend) name = _friend.name || _friend.username;
                                    } else {
                                        let _friend = await client.database.functions.get_user(room.members[0]);
                                        if (_friend) name = _friend.name || _friend.username;
                                    }
                                } else name = room.name;
                                let messages = chat.messages.slice(-20);
                                for (let i = 0; i < messages.length; i++) {
                                    let _user = await client.database.functions.get_user(messages[i].user);
                                    messages[i].username = _user.username;
                                }
                                callback({ user: user.id, messages, id, name: name ? name : 'unknown', mm: chat.messages.length > 20 ? true : false });
                            }
                        } else callback({ id, error: '<p>Oops! Chat Not Be Found</p><p>Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</p>' });
                    } else callback({ id, error: '<p>Oops! Chat Not Be Found</p><p>Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</p>' });
                }
            });
            socket.on('load-more-messages', async id => {
                if (id && id.length > 8 && socket.chat_id) {
                    let chat = await client.database.chat.findById(socket.chat_id);
                    if (chat && chat.room_id == socket.room_id) {
                        let a = chat.messages.length;
                        while(a--) {
                            if (chat.messages[a]?.id == id) {
                                let messages = (a && a > 20) ? chat.messages.slice(a - 20, a) : messages = chat.messages.slice(0, a);
                                for (let i = 0; i < messages.length; i++) {
                                    let user = await client.database.functions.get_user(messages[i].user);
                                    messages[i].username = user.username;
                                }
                                socket.emit('receive-more-messages', { id: socket.room_id, messages, mm: a - 20 > 20 ? true : false });
                                break;
                            }
                        }
                    }
                }
            });
            socket.on('send-message', async ({ id, _message, _id }) => {
                let message = _message?.trim();
                if (socket.room_id == id && message?.length < 2000) {
                    let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
                    if (user?.id == socket.user_id) {
                        if (user.rooms.includes(id)) {
                            let room = await client.database.functions.get_room(socket.room_id);
                            if (room?.members?.includes(user.id)) {
                                let chat = await client.database.chat.findById(room.chat_id);
                                if (chat) {
                                    let chat_data = {
                                        id: Math.random().toString(36).substring(2, 15),
                                        user: user.id,
                                        message,
                                        time: Date.now(),
                                        seen_by: []
                                    };
                                    chat.messages.push(chat_data);
                                    await chat.save();
                                    chat_data.username = user.username;
                                    io.to(socket.room_id).emit('receive-message', { user: user.id, id: room.id, chat: chat_data, _id });
                                    [...client.database_cache.users].filter(r_user => r_user.rooms?.includes(room.id))?.forEach(r_user => {
                                        io.to(r_user.id).emit('new-message', { message, id: room.id, user: user.username, _id });
                                    });
                                    Promise.all(room.members.map(user => client.database.functions.get_user(user))).then(users => {
                                        Promise.all(users.filter(x => x).map(user => {
                                            let save = false;
                                            if (!user.rooms.includes(room.id)) {
                                                user.rooms.push(room.id); save = true;
                                            }
                                            if (user.rooms[0] !== room.id) {
                                                user.rooms = user.rooms.filter(item => item !== room.id);
                                                user.rooms.unshift(room.id); save = true;
                                            }
                                            if (save) {
                                                user.markModified('rooms');
                                                return user.save();
                                            }
                                        }));
                                    });
                                } else socket.emit('error', 'chat does not exist');
                            } else socket.emit('error', 'room does not exist');
                        }
                    } else socket.emit('redirect', '/login?ref=messages');
                }
            });
            socket.on('delete-message', async ({ id, _id }, callback) => {
                if (!callback && typeof callback !== 'function') return false;
                if (_id && id?.length > 8 && _id === socket.room_id) {
                    let chat = await client.database.chat.findById(socket.chat_id);
                    if (chat.room_id == socket.room_id) {
                        let a = chat.messages.find(x => x.id == id);
                        if (a) {
                            a.message = null;
                            chat.markModified('messages');
                            await chat.save();
                            callback({ id, done: true });
                            socket.broadcast.to(socket.room_id).emit('update-message', { id: socket.room_id, chat: a });
                        } else callback({ id, done: false });
                    }
                }
            });
            socket.on('disconnect', async () => {
                client.cache.functions.update_user({ username: user.username, status: 'offline' });
            });
        } else socket.emit('redirect', '/login?ref=messages');
    });
}
