module.exports.sockets = (io, client) => {
    io.on('connection', async (socket) => {
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            socket.join(user.id);
            socket.user_id = user.id;
            client.cache.functions.update_user({ username: user.username, status: 'online' });
            socket.on('join-room', async (id) => {
                let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
                if (user?.id == socket.user_id) {
                    const room = await client.database.functions.get_room(id);
                    if (room) {
                        const chat = await client.database.chat.findById(room.chat_id);
                        if (chat) {
                            socket.leave(socket.room_id);
                            socket.join(room.id);
                            socket.room_id = room.id;
                            socket.chat_id = room.chat_id;
                            socket.emit('receive-messages', { messages: chat.messages.slice(-10), id });
                        }
                    }
                } else socket.emit('redirect', '/login?ref=messages');
            });
            socket.on('send-message', async ({ id, _message, _id }) => {
                let message = _message?.trim();
                if (socket.room_id == id && message?.length < 2000) {
                    let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
                    if (user?.id == socket.user_id) {
                        if (user.rooms.includes(id)) {
                            let room = await client.database.get_room(socket.room_id);
                            if (room?.members?.includes(user.id)) {
                                let chat = await client.database.chat.findById(room.chat_id);
                                if (chat) {
                                    chat.messages.push({
                                        user: user.username,
                                        message,
                                        time: Date.now(),
                                        seen_by: []
                                    });
                                    await chat.save();
                                    io.to(socket.room_id).emit('receive-message', { message, id: room.id, user: user.username, _id });
                                    [...client.database_cache.users].filter(r_user => r_user.rooms?.includes(room.id))?.forEach(r_user => {
                                        io.to(r_user.id).emit('new-message', { message, id: room.id, user: user.username, _id });
                                    });
                                } else socket.emit('error', 'chat does not exist');
                            } else socket.emit('error', 'room does not exist');
                        }
                    } else socket.emit('redirect', '/login?ref=messages');
                }
            })
            socket.on('disconnect', async () => {
                client.cache.functions.update_user({ username: user.username, status: 'offline' });
            });
        } else socket.emit('redirect', '/login?ref=messages');
    });
}
