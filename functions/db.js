module.exports = (client) => {
    // user database function
    client.database.functions.get_user = async ( username ) => {
        if (!username) return false;
        let user = client.database_cache.users.get(username);
        if (user) return user;
        else {
            user = await client.database.user.findOne({ username });
            if (user) {
                client.database_cache.users.set(user.username, user);
                return user;
            } else return false;
        }
    }
    client.database.functions.get_user_by_email = async ( email ) => {
        if (!email) return false;
        let user;
        for (const [key, value] of client.database_cache.users) if (value.elements?.email == email) user = client.database_cache.users.get(key);
        if (user) return user;
        else {
            user = await client.database.user.findOne({ email });
            if (user) {
                client.database_cache.users.set(user.username, user);
                return user;
            } else return false;
        }
    }
    client.database.functions.create_user = async ( username, email, password, name) => {
        let user = client.database_cache.users.get(username);
        if (user) return false;
        else {
            user = await client.database.user.findOne({ username });
            if (user) {
                client.database_cache.users.set(user.username, user);
                return false;
            } else {
                try {
                    let user_data = new client.database.user({ username, email, password, name });
                    await user_data.save();
                    client.database_cache.users.set(user_data.username, user_data);
                    return user_data;
                } catch (err) {
                    console.log(err);
                    return false;
                }
            }
        }
    }
    client.database.functions.delete_user = async ( username ) => {
        let user = await client.database.user.findOne({ username });
        if (user) {
            user = {
                username: user.username,
                deleted: true,
            };
            await user.save();
            client.database.users.set(user.username, user);
            return true;
        } else return false;
    }
    // room database functions
    client.database.functions.create_room = async ( name, members, type = 'private' ) => {
        const room = new client.database.room({ name, members, type });
        const chat = new client.database.chat({ room_id: room.id });
        room.chat_id = chat.id;
        await room.save();
        await chat.save();
        members.forEach(async x => {
            let member = await client.database.functions.get_user(x);
            member.rooms.push(room.id);
            await member.save();
        });
        console.log(chat);
        client.database_cache.rooms.set(room.id, room);
        return room;
    }
    client.database.functions.get_room = async ( id ) => {
        let room = client.database_cache.rooms.get(id);
        if (room) return room;
        else {
            room = await client.database.room.findById(id);
            if (room) {
                client.database_cache.rooms.set(room.id, room);
                return room;
            } else return false;
        }
    }
    client.database.functions.get_chat = async (room_id) => {
        return await client.database.chat.findOne({ room_id });
    }
    client.database.functions.find_common_room = async ( _user1, _user2, is_private = true ) => {
        return await client.database.room.findOne({ type: is_private ? 'private' : 'public', members: { $in: [_user1, _user2] } });
    }
    client.database.functions.delete_messages = async (chat_id) => {
        let chat = await client.database.chat.findById(chat_id);
        if (chat) {
            chat.messages = [];
            await chat.save();
        }
    }
    // end

    client.database.functions.create_token = async ( username, type = 'verification', expire_at = Date.now() + 24 * 60 * 60 * 1000 ) => {
        let token = await client.database.token.findOne({ username, type });
        if (token) return token;
        else {
            token = new client.database.token({ username, token });
            await token.save();
            return token;
        }
    }
}