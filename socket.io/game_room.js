const ObjectId = require("mongodb").ObjectId;
const is_function = value => value && (Object.prototype.toString.call(value) === "[object Function]" || "function" === typeof value || value instanceof Function);
const xss = require('xss');

let games = {};

if (process.env.DEV) games = {
    'tic tac toe': {
        id: '62e3237789fb2a158e8ccc2f',
        player_limit: 20,
    }
}

module.exports = (io, client, socket) => {
    socket.on('game-room-create', async (name, options = {}, callback) => {
        if (!is_function(callback)) return false;
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            if (!name || !(name.length > 3 && name.length < 33)) return callback({ error: 'missing or invalid informations provided' });
            let host_game_room_exists = await client.database.game_room.exists({ host: user.id });
            if (host_game_room_exists) return callback({ error: 'You can only keep one game room open at a time' });
            let game_room = await client.database.functions.create_game_room({
                name: xss(name),
                host: user.id,
                players: [ user.id ],
                private: Boolean(options?.private),
                leaderboard: [
                    {
                        id: user.id,
                        win: 0,
                        lose: 0,
                        draw: 0
                    }
                ],
            });
            if (game_room) {
                socket.join(game_room.id);
                socket.game_room_id = game_room.id;
                callback({ error: false, game_room });
            } else callback({ error: 'Something went wrong, try again later' });
        }
    });
    socket.on('game-room-join', async (id, callback) => {
        if (!is_function(callback)) return false;
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            let game_room = await client.database.functions.get_game_room(id);
            if (!game_room) return callback({ error: 'Room not found, deleted or is temporarily unavailable' });
            if (!game_room.players.includes(user.id)) {
                if (game_room.players.length >= game_room.player_limit) return callback({ error: `Room is full` });
                game_room.players.push(user.id);
                game_room.leaderboard.push({
                    user: user.id,
                    win: 0,
                    lose: 0,
                    draw: 0
                });
                game_room.messages.push({
                    message: `User ${user.username} joined the game!`,
                });
                game.mark_modified(`rooms[${_game_room}]`);
                await game.save();
            }
            if (socket.game_room_id !== game_room.id) {
                socket.leave(socket.game_room_id);
                socket.join(game_room.id);
                socket.game_room_id = game_room.id;
            }
            io.to(game_room.id).emit(`game-room-message`, {
                message: `User ${user.username} joined the game!`
            });
            callback({ error: false, game_room: {
                id: game_room.id,
                host: game_room.host,
                name: game_room.name,
                players: game_room.players,
                private: game_room.private,
                leaderboard: game_room.leaderboard
            }});
        }
    });
    socket.on('game-room-leave', async (id, delete_room, callback) => {
        if (!is_function(callback)) return false;
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            let game_room = await client.database.functions.get_game_room(id);
            if (!game_room) return callback({ error: 'Room not found, deleted or is temporarily unavailable' });
            if (!game_room.players.includes(user.id)) return callback({ error: 'You are not in the room' });
            if ((game_room.host == user.id && delete_room) || game_room.players.length == 1) {
                for (let i = 0; i < game_room.players.length; i++) {
                    let player = game_room.players[i];
                    io.to(player).emit('game-room-kick', {
                        message: `Game room ${game_room.name} has been deleted`,
                        room_id: game_room.id,
                    });
                }
                io.in(game_room.id).socketsLeave(game_room.id);
                await game_room.remove();
                callback({ error: false });
            } else {
                socket.leave(socket.game_room_id);
                socket.game = null;
                socket.game_room_id = null;
                callback({ error: false });
            }
        }
    });
    socket.on('game-room-delete', async (id, callback) => {
        if (!is_function(callback)) return false;
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            let game_room = await client.database.functions.get_game_room(id);
            if (!game_room) return callback({ error: 'Room not found, deleted or is temporarily unavailable' });
            if (!game_room.players.includes(user.id)) return callback({ error: 'You are not in the room' });
            if (game_room.host !== user.id) return callback({ error: 'Only room host can delete a room' });
            for (let i = 0; i < game_room.players.length; i++) {
                let player = game_room.players[i];
                io.to(player).emit('game-room-kick', {
                    message: `Game room ${game_room.name} has been deleted`,
                    room_id: game_room.id,
                });
            }
            io.in(game_room.id).socketsLeave(game_room.id);
            await game_room.remove();
            callback({ error: false });
        }
    });
    socket.on('game-room-change-host', async (id, new_host, callback) => {
        if (!is_function(callback)) return false;
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            let game_room = await client.database.functions.get_game_room(id);
            if (!game_room) return callback({ error: 'Room not found, deleted or is temporarily unavailable' });
            if (!game_room.players.includes(user.id)) return callback({ error: 'You are not in the room' });
            if (game_room.host !== user.id) return callback({ error: 'Only room host can delete a room' });
            let new_host_user = await client.database.functions.get_user(new_host);
            if (!new_host_user) callback({ error: 'New host user does not exist' });
            let new_host_user_room_exist = await client.database.game_room.exists({ host: new_host_user.id });
            if (new_host_user_room_exist) return callback({ error: `User ${new_host_user.username} already have a game room` });
            game_room.host = new_host;
            game_room.mark_modified('host');
            await game_room.save();
            io.to(game_room.id).emit('game-room-message', {
                message: `Room host has been changed to <br>${new_host_user.username}</br>`,
            });
            callback({ error: false });
        }
    });
    socket.on('game-room-send-message', async (room_id, { id, _message, _id, }, callback) => {
        if (!is_function(callback)) return false;
        let user =  await client.database.functions.get_user(socket.request.session?.passport?.user);
        if (user) {
            let game_room = await client.database.functions.get_game_room(room_id);
            if (!game_room) return callback({ error: 'Room not found, deleted or is temporarily unavailable' });
            if (!game_room.players.includes(user.id)) return callback({ error: 'You are not in the room' });
            let message = _message?.trim();
            if (_message?.length > 2000) return callback({ error: 'Message can only contain 2000 characters' });
            let chat_data = {
                id: Math.random().toString(36).substring(2, 15),
                user: user.id,
                message: xss(message),
                time: Date.now(),
            }
            game_room.messages.push(chat_data);
            game_room.mark_modified(`messages[${game.messages.length - 1}]`);
            await game_room.save();
            callback({ error: false, user: user.id, id: game_room.id, chat: chat_data, _id });
        }
    });
}
