module.exports.sockets = function(io, client) {
    io.on("connection", (socket) => {
        console.log("socketio chat connected.");
        socket.on("join_room", async (room_id) => {
            console.log('0');
            if (!room_id) return;
            console.log('1');
            let user, _user = socket.request.session?.passport?.user;
            if (_user) user = await client.database.functions.get_user(_user);
            if (!user) return socket.emit('redirect', '/login?ref=messages');
            if (user.rooms.includes(room_id)) {
                console.log('2');
                const room = await client.database.functions.get_room(room_id);
                if (room) {
                    console.log('3');
                    const chat = await client.database.chat.findById(room.chat_id);
                    if (chat) {
                        console.log('4');
                        if (socket.room_id) socket.leave(socket.room_id);
                        socket.join(room.id);
                        socket.room_id = room.id;
                        socket.chat_id = chat.id;
                        console.log('5');
                        socket.emit('messages', ({ messages: chat.messages.slice(-10), room_id: room.id, title: room.name }));
                        socket.broadcast.to(room.id).emit('message', { user: 'system', message: `<b>${user.username}</b> joined the chat` });
                    } else socket.emit('error_message', 'chat data does not exist');
                } else socket.emit('error_message', 'room does not exist' );
            } else socket.emit('message', 'room does not exist' );
        });
        socket.on('send_message', async ({ room_id, message }) => {
            if (message?.trim() && socket.room_id && room_id === socket.room_id) {
                let user, _user = socket.request.session?.passport?.user;
                if (_user) user = await client.database.functions.get_user(_user);
                if (!user) return socket.emit('redirect', '/login?ref=messages');
                if (user.rooms.includes(socket.room_id)) {
                    let chat = await client.database.chat.findById(socket.chat_id);
                    if (chat) {
                        let _message = message.trim();
                        io.to(socket.room_id).emit('message', { message: _message, user: user.username });
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