const ObjectId = require("mongodb").ObjectId;

module.exports = (client) => {
    // user database function
    client.database.functions.get_user = async ( id ) => {
        if (!id || !ObjectId.isValid(id)) return false;
        let user = client.database_cache.users.get(id);
        if (user) return user;
        else {
            user = await client.database.user.findById(id);
            if (user) {
                client.database_cache.users.set(user.id, user);
                return user;
            } else return false;
        }
    }
    client.database.functions.get_user_by_username = async ( username ) => {
        if (username?.length < 3) return false;
        let user;
        for (const [key, value] of client.database_cache.users) if (value.elements?.username == username) user = client.database_cache.users.get(key);
        if (user) return user;
        else {
            user = await client.database.user.findOne({ username });
            if (user) {
                client.database_cache.users.set(user.id, user);
                return user;
            } else return false;
        }
    }
    client.database.functions.get_user_by_email = async ( email ) => {
        if (!email) return false;
        if (!email.match(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i)) return false;
        let user;
        for (const [key, value] of client.database_cache.users) if (value.elements?.email == email) user = client.database_cache.users.get(key);
        if (user) return user;
        else {
            user = await client.database.user.findOne({ email });
            if (user) {
                client.database_cache.users.set(user.id, user);
                return user;
            } else return false;
        }
    }
    client.database.functions.create_user = async ( username, email, password, name) => {
        let user = client.database_cache.users.get(username);
        if (user) return false;
        else try {
            let user_data = new client.database.user({ username, email, password, name });
            await user_data.save();
            client.database_cache.users.set(user_data.id, user_data);
            return user_data;
        } catch (err) {
            console.log(err);
            return false;
        }
    }
    client.database.functions.delete_user = async ( id ) => {
        let user = await client.database.user.findById(id);
        if (user) {
            user = {
                username: user.username,
                email: user.email,
                deleted: true,
            };
            await user.save();
            client.database.users.set(user.id, user);
            return true;
        } else return false;
    }
    // room database functions
    client.database.functions.create_room = async ( name, members, _u, type = 'private' ) => {
        const room = new client.database.room({ name, members, type });
        const chat = new client.database.chat({ room_id: room.id });
        room.chat_id = chat.id;
        await room.save();
        await chat.save();
        if (_u) {
            let user = await client.database.functions.get_user(_u);
            user.rooms.push(room.id);
            await user.save();

        } else {
            Promise.all(members.map(id => client.database.users.get_user(id))).then(users => {
                Promise.all(users.map(user => {
                    user.rooms.push(room.id);
                    return user.save();
                }));
            });
        }
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
    client.database.functions.find_common_room = async ( _user1, _user2, is_private = true ) => {
        let room = await client.database.room.findOne({ type: is_private ? 'private' : 'public', members: { $in: [_user1, _user2] } });
        return room;
    }
    client.database.functions.delete_messages = async (chat_id) => {
        let chat = await client.database.chat.findById(chat_id);
        if (chat) {
            chat.messages = [];
            await chat.save();
        }
    }
    // end

    client.database.functions.create_token = async ( user_id, type = 'verification', expire_at = Date.now() + 24 * 60 * 60 * 1000 ) => {
        let token = await client.database.token.findOne({ user_id, type });
        if (token) return token;
        else {
            token = new client.database.token({ user_id, token });
            await token.save();
            return token;
        }
    }
}
