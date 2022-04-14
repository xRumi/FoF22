const ObjectId = require("mongodb").ObjectId;

module.exports.sockets = (io, client) => {
    io.on('connection', async (socket) => {
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            socket.join(user.id);
            socket.user_id = user.id;
            client.cache.functions.update_user({ username: user.username, status: 'online' });
            socket.on('autocomplete', async (term) => {
                console.log(term);
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
                    socket.emit('autocomplete-response', result);
                }
            })
            socket.on('join-room', async (id) => {
                let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
                if (user?.id == socket.user_id && id) {
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
                                socket.emit('receive-messages', { user: user.id, messages, id, name: name ? name : 'unknown', mm: chat.messages.length > 20 ? true : false });
                            }
                        } else socket.emit('join-room-error', { id, message: '<p>Oops! Chat Not Be Found</p><p>Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</p>' });
                    } else socket.emit('join-room-error', { id, message: '<p>Oops! Chat Not Be Found</p><p>Sorry but the chat room you are looking for does not exist, have been removed. id changed or is temporarily unavailable</p>' });
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
                                } else socket.emit('error', 'chat does not exist');
                            } else socket.emit('error', 'room does not exist');
                        }
                    } else socket.emit('redirect', '/login?ref=messages');
                }
            });
            socket.on('delete-message', async ({ id, _id }) => {
                if (_id && id?.length > 8 && _id === socket.room_id) {
                    let chat = await client.database.chat.findById(socket.chat_id);
                    if (chat.room_id == socket.room_id) {
                        let a = chat.messages.find(x => x.id == id);
                        if (a) {
                            a.message = null;
                            chat.markModified('messages');
                            await chat.save();
                            socket.emit('delete-message-response', { id, done: true });
                            socket.broadcast.to(socket.room_id).emit('update-message', { id: socket.room_id, chat: a });
                        } else socket.emit('delete-message-response', { id, done: false });
                    }
                }
            });
            socket.on('disconnect', async () => {
                client.cache.functions.update_user({ username: user.username, status: 'offline' });
            });
        } else socket.emit('redirect', '/login?ref=messages');
    });
}
