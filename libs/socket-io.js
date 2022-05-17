const ObjectId = require("mongodb").ObjectId;
const is_function = value => value && (Object.prototype.toString.call(value) === "[object Function]" || "function" === typeof value || value instanceof Function);

module.exports.sockets = (io, client) => {
    io.on('connection', async (socket) => {
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            socket.join(user.id);
            socket.user_id = user.id;
            client.cache.functions.update_user({ username: user.username, status: 'online' });
            socket.on('autocomplete', async (term, callback) => {
                if (!is_function(callback)) return false;
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
                if (!is_function(callback)) return false;
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
            socket.on('leave-room', async (id) => {
                socket.leave(socket.room_id);
                socket.room_id = null;
                socket.chat_id = null;
                socket.typing = null;
            });
            socket.on('join-room', async (id, callback) => {
                if (!is_function(callback)) return false;
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
                                    socket.typing = [];
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
                                let messages = chat.messages.slice(-7);
                                Promise.all(messages.map(message => client.database.functions.get_user(message.user))).then(users => {
                                    messages = messages.map(x => {
                                        return {
                                            id: x.id,
                                            user: x.user,
                                            username: users.find(y => y.id == x.user)?.username,
                                            message: x.message,
                                            time: x.time,
                                            seen_by: x.seen_by
                                        }
                                    });
                                    let message_unread_exists = user.unread.messages.indexOf(room.id);
                                    if (message_unread_exists > -1) {
                                        user.unread.messages.splice(message_unread_exists, 1);
                                        user.markModified('unread.messages'); user.save();
                                        io.to(user.id).emit('unread', ({ messages: user.unread.messages }));
                                    }
                                    callback({ user: user.id, messages, id, name: name ? name : 'unknown', mm: chat.messages.length > 7 ? true : false });
                                });
                            }
                        } else callback({ id, error: '<p>Oops! Chat Not Be Found</p><p>Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</p>' });
                    } else callback({ id, error: '<p>Oops! Chat Not Be Found</p><p>Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</p>' });
                }
            });
            socket.on('load-more-messages', async (id, callback) => {
                if (!is_function(callback)) return false;
                if (id && id.length > 8 && socket.chat_id) {
                    let chat = await client.database.chat.findById(socket.chat_id);
                    if (chat && chat.room_id == socket.room_id) {
                        let a = chat.messages.length;
                        while(a--) {
                            if (chat.messages[a]?.id == id) {
                                let messages = (a && a > 7) ? chat.messages.slice(a - 7, a) : chat.messages.slice(0, a);
                                Promise.all(messages.map(message => client.database.functions.get_user(message.user))).then(users => {
                                    for (let i = 0; i < users.length; i++) {
                                        let user = users[i];
                                        let message = messages.find(x => x.user == user.id);
                                        if (message) message.username = user.username;
                                    }
                                    callback({ id: socket.room_id, messages, mm: a - 7 > 7 ? true : false })
                                });
                                break;
                            }
                        }
                    }
                }
            });
            socket.on('messages-typing', is => {
                if (socket.room_id && socket.user_id) {
                    let user_id = socket.user_id;
                    if (socket.typing) {
                        if (is) {
                            if (!socket.typing.includes(user_id)) socket.typing.push(user_id);
                        } else if (socket.typing.includes(user_id)) {
                            let u_index = socket.typing.indexOf(user_id);
                            if (u_index > -1) socket.typing.splice(u_index, 1);
                        }
                    } else if (is) socket.typing = [user_id];
                    Promise.all(socket.typing.map(x => client.database.functions.get_user(x))).then(users => {
                        let usernames = users.map(x => x.username);
                        socket.broadcast.to(socket.room_id).emit('messages-typing-response', { room_id: socket.room_id, typing: usernames });
                    });
                }
            });
            socket.on('send-message', async ({ id, _message, _id }, callback) => {
                if (!socket.room_id || socket.room_id !== id) {
                    if (!is_function(callback)) return false;
                    callback();
                }
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

                                    /*io.to('6241d152216bc87c370928f6').emit('receive-message', { user: '61d001de9b64b8c435985da5e', id: '6241d152216bc87c370928f6', chat_data: {
                                        id: Math.random().toString(36).substring(2, 15),
                                        user: '61d001de9b64b8c435985da5',
                                        message: 'hey!',
                                        time: Date.now(),
                                        seen_by: []
                                    } });*/

                                    let room_members = [], _room_members = io.sockets.adapter.rooms.get(room.id);

                                    for (const id of _room_members ) {
                                        const room_member_socket = io.sockets.sockets.get(id);
                                        if (room_member_socket.user_id) room_members.push(room_member_socket.user_id);
                                    }
                                    
                                    Promise.all(room.members.map(user => client.database.functions.get_user(user))).then(users => {
                                        Promise.all(users.filter(x => x).map(user => {
                                            let save = false;
                                            if (!user.rooms.includes(room.id)) {
                                                user.rooms.push(room.id); save = true;
                                                user.markModified('rooms');
                                            }
                                            if (user.rooms[0] !== room.id) {
                                                user.rooms = user.rooms.filter(item => item !== room.id);
                                                user.rooms.unshift(room.id); save = true;
                                                user.markModified('rooms');
                                            }
                                            let message_unread_exists = user.unread.messages.indexOf(room.id);
                                            if (room_members.includes(user.id)) {
                                                if (message_unread_exists > -1) {
                                                    user.unread.messages.splice(message_unread_exists, 1);
                                                    user.markModified('unread.messages'); save = true;
                                                    io.to(user.id).emit('unread', ({ messages: user.unread.messages }));
                                                }
                                            } else if (!user.unread.messages.includes(room.id)) {
                                                user.unread.messages.push(room.id); save = true;
                                                user.markModified('unread.messages');
                                                io.to(user.id).emit('unread', ({ messages: user.unread.messages }));
                                            }
                                            if (save) return user.save();
                                            else return true;
                                        }));
                                    });
                                } else socket.emit('error', 'chat does not exist');
                            } else socket.emit('error', 'room does not exist');
                        }
                    } else socket.emit('redirect', '/login?ref=messages');
                }
            });
            socket.on('delete-message', async ({ id, _id }, callback) => {
                if (!is_function(callback)) return false;
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
