module.exports.sockets = (io, client) => {
    io.on('connection', async (socket) => {
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            socket.join(user.id);
            socket.user_id = user.id;
            client.cache.functions.update_user({ username: user.username, status: 'online' });
            socket.on('send-message', async ({ id, _message, _id }) => {
                let message = _message?.trim();
                if (id && message?.length < 2000) {
                    let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
                    if (user && user.id == socket.user_id) {
                        if (user.rooms.includes(id)) {
                            let room = await client.database.get_room(id);
                            if (room) {
                                let chat = await client.database.chat.findById(room.chat_id);
                                if (chat) {
                                    io.to(user.id).emit('receive-message', { message, id: room.id, user: user.username, _id });
                                    chat.messages.push({
                                        user: user.username,
                                        message,
                                        time: Date.now(),
                                    });
                                    await chat.save();
                                    [...client.database_cache.users].filter(r_user => r_user.rooms?.includes(room.id))?.forEach(r_user => {
                                        io.to(r_user.id).emit('receive-message', { message, id: room.id, user: user.username, _id });
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
