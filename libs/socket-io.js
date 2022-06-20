const ObjectId = require("mongodb").ObjectId;
const is_function = value => value && (Object.prototype.toString.call(value) === "[object Function]" || "function" === typeof value || value instanceof Function);
const fs = require("fs");
const path = require('path');

module.exports.sockets = (io, client) => {
    io.on('connection', async (socket) => {
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            socket.join(user.id);
            socket.user_id = user.id;
            client.cache.functions.update_user(user.id, { status: 'online' });
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
                        if (!user.rooms.some(x => x.id === room_exists.id)) {
                            user.rooms.push({
                                id: room_exists.id,
                            });
                            await user.save();
                        }
                        if (!_user.rooms.some(x => x.id === room_exists.id)) {
                            _user.rooms.push({
                                id: room_exists.id,
                            });
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
                            const chat = await client.database.functions.get_chat(room.chat_id);
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
                                let messages = chat.messages.slice(-7).filter(x => x);
                                Promise.all(messages.map(message => client.database.functions.get_user(message.user))).then(users => {
                                    for (let i = 0; i < users.length; i++) {
                                        let user = users[i];
                                        let message = messages.find(x => x.user == user.id);
                                        if (message) message.username = user.username;
                                    }
                                    let user_room = user.rooms.find(x => x.id == room.id);
                                    if (user_room && user_room.unread) {
                                        user_room.unread = false;
                                        user.mark_modified('rooms'); user.save();
                                        io.to(user.id).emit('unread', ({ messages: {
                                            count: user.rooms.filter(x => x.unread).length,
                                            read: [user_room.id]
                                        } }));
                                    }
                                    client.cache.functions.get_many_user(room.members, (error, result = []) => {
                                        if (error) console.log('[socket-io.js] get_many_user callback error');
                                        let members = room.type == 'private' ? result : null;
                                        callback({ chat_data: {
                                            is_private: room.type == 'private' && room.members.length < 3,
                                            total_member: room.members.length,
                                            members,
                                        }, user: user.id, messages, id, name: name || 'unknown', mm: chat.messages.length > 7 });
                                    });
                                });
                            }
                        } else callback({ id, error: '<p>Oops! Chat Not Be Found</p><p>Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</p>' });
                    } else callback({ id, error: '<p>Oops! Chat Not Be Found</p><p>Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</p>' });
                }
            });
            /* TODO: socket.on('get-room-member') */
            socket.on('load-more-messages', async (id, callback) => {
                if (!is_function(callback)) return false;
                if (id && id.length > 8) {
                    if (!socket.chat_id) return callback(false);
                    let chat = await client.database.functions.get_chat(socket.chat_id);
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
                                    callback({ id: socket.room_id, messages, mm: a - 7 > 0 ? true : false })
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
            socket.on('send-message', async ({ id, _message, _id, _attachments = [] }, callback) => {
                if (!is_function(callback)) return false;
                if (!socket.room_id || socket.room_id !== id) return callback({ join_room: true });
                let message = _message?.trim();
                if (_attachments.length >= 10) return false;
                if (socket.room_id == id && message?.length < 2000 && (message.length || _attachments.length)) {
                    let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
                    if (user?.id == socket.user_id) {
                        if (user.rooms.some(x => x.id == id)) {
                            let room = await client.database.functions.get_room(socket.room_id);
                            if (room?.members?.includes(user.id)) {
                                let chat = await client.database.functions.get_chat(room.chat_id);
                                if (chat) {
                                    let room_img_path = path.join(__dirname, `/../public/uploads/rooms/${room.id}`);
                                    if (_attachments.length) {
                                        if (!fs.existsSync(room_img_path)) fs.mkdir(room_img_path, { recursive: true }, (err) => {
                                            if (err) throw err;
                                        });
                                    }

                                    const process_file = async (attachment) => {
                                        if (attachment && attachment.name && attachment.type?.match('image') && attachment.size == attachment.bytes?.length) {
                                            attachment.name = attachment.name.substring(0, 100);
                                            return new Promise((resolve, reject) => {
                                                let __id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                                                let attachment_extension = attachment.name.includes('.') ? attachment.name.split('.').pop() : false;
                                                let attachment_path_inside_room = __id + (attachment_extension?.length < 8 ? `.${attachment_extension}` : '');
                                                let buffer = Buffer.from(attachment.bytes);
                                                fs.writeFile(`${room_img_path}/${attachment_path_inside_room}`, buffer, (err, result) => {
                                                    if (!err) resolve({
                                                        name: attachment.name,
                                                        type: attachment.type,
                                                        size: attachment.size,
                                                        url: `/uploads/rooms/${room.id}/${attachment_path_inside_room}`
                                                    });
                                                    else reject();
                                                });
                                            });
                                        } else return false;
                                    }

                                    Promise.all(_attachments.map(attachment => process_file(attachment))).then(async attachments => {
                                    
                                        let chat_data = {
                                            id: Math.random().toString(36).substring(2, 15),
                                            user: user.id,
                                            message,
                                            time: Date.now(),
                                            seen_by: [],
                                            attachments
                                        };
                                        chat.messages.push(chat_data);
                                        chat.mark_modified(`messages[${chat.messages.length - 1}]`);
                                        await chat.save();
                                        chat_data.username = user.username;
                                        
                                        callback({ success: true, user: user.id, id: room.id, chat: chat_data, _id });
                                        socket.broadcast.to(socket.room_id).emit('receive-message', { user: user.id, id: room.id, chat: chat_data, _id });

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
                                            if (room_member_socket?.user_id) room_members.push(room_member_socket.user_id);
                                        }
                                        
                                        Promise.all(room.members.map(user => client.database.functions.get_user(user))).then(users => {
                                            Promise.all(users.filter(x => x).map(user => {
                                                let save = false;
                                                if (!user.rooms.some(x => x.id === room.id)) {
                                                    user.rooms.push({
                                                        id: room.id
                                                    }); save = true;
                                                    user.mark_modified('rooms');
                                                }
                                                if (user.rooms[0]?.id !== room.id) {
                                                    let user_room_index = user.rooms.findIndex(x => x.id == room.id);
                                                    if (user_room_index > -1) {
                                                        let _user_room = user.rooms[user_room_index];
                                                        user.rooms.splice(user_room_index, 1); save = true;
                                                        user.rooms.unshift(_user_room);
                                                        user.mark_modified('rooms');
                                                    }
                                                }
                                                let user_room = user.rooms.find(x => x.id == room.id);
                                                if (room_members.includes(user.id)) {
                                                    if (user_room && user_room.unread) {
                                                        user_room.unread = false; save = true;
                                                        user.mark_modified('rooms');
                                                        io.to(user.id).emit('unread', ({ messages: {
                                                            count: user.rooms.filter(x => x.unread).length,
                                                            read: [user_room.id]
                                                        } }));
                                                    }
                                                } else if (!user_room.unread) {
                                                    user_room.unread = true; save = true;
                                                    user.mark_modified('rooms');
                                                    io.to(user.id).emit('unread', ({ messages: {
                                                        count: user.rooms.filter(x => x.unread).length,
                                                        unread: [user_room.id]
                                                    } }));
                                                }
                                                if (save) return user.save();
                                                else return true;
                                            }));
                                        });
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
                    let chat = await client.database.functions.get_chat(socket.chat_id);
                    if (chat.room_id == socket.room_id) {
                        let _a = chat.messages.findIndex(x => x.id == id);
                        if (_a > -1) {
                            let a = chat.messages[_a];
                            if (!a.deleted) {
                                a.deleted = true;
                                a.message = null;
                                a.attachments = [];
                                chat.mark_modified(`messages[${_a}]`);
                                await chat.save();
                                callback({ id, done: true });
                                socket.broadcast.to(socket.room_id).emit('update-message', { id: socket.room_id, chat: a });
                            } else callback({ id, done: false });
                        } else callback({ id, done: false });
                    }
                }
            });
            socket.on('disconnect', async () => {
                client.cache.functions.update_user(user.id, { status: 'offline', last_online: Date.now() });
            });
        } else socket.emit('redirect', '/login?ref=messages');
    });
}
