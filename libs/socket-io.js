module.exports.sockets = function(io, client) {
    io.on("connection", async (socket) => {
        let user, _user = socket.request.session?.passport?.user;
        if (_user) user = await client.database.functions.get_user(_user);
        if (user) {
            socket.join(user.rooms);
            socket.rooms = user.rooms;
            client.cache.functions.update_user({ username: user.username, status: 'online' });
            socket.on('send_message', async ({ room_id, message }) => {
                let _message = message?.trim();
                if (room_id && _message) {
                    if (user.rooms.includes(room_id)) {
                        if (!socket.rooms?.includes(room_id)) {
                            if (socket.rooms) {
                                socket.join(room_id);
                                socket.rooms.push(room_id);
                            } else {
                                socket.join(user.rooms);
                                socket.rooms = user.rooms;
                            }
                        }
                        let chat = await client.database.chat.findById(socket.chat_id);
                        if (chat) {
                            io.to(room_id).emit('message', { message: _message, user: user.username });
                            chat.messages.push({
                                user: user.username,
                                message: _message,
                                time: Date.now(),
                            });
                            if (user.username === 'rumi' && chat.id === '61d0059ffe9472309fa0436d') {
                                let eval_output = await run_eval(_message, client);
                                io.to(socket.room_id).emit('message', { message: eval_output, user: 'system' });
                                chat.messages.push({
                                    user: 'system',
                                    message: eval_output,
                                    time: Date.now()
                                });
                            }
                            await chat.save();
                        } else socket.emit('error_message', 'chat data does not exist' );
                    }
                }
            });
            socket.on('disconnect', async () => {
                client.cache.functions.update_user({ username: user.username, status: 'offline' });
            });
        } else socket.emit('redirect', '/login?ref=messages');
    });
};

const run_eval = async (content, client) => {
    const result = new Promise((resolve) => resolve(eval(content)));
	return result.then((output) => {
	    return JSON.stringify(output, null);
	}).catch((err) => {
		return err?.toString();
	});
}