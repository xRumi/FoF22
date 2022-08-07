const ObjectId = require("mongodb").ObjectId;

module.exports = function (client) {
    const redis_game_room = {
        get: async (id) => {
            let game_room = await client.redis.call('JSON.GET', `game_room:${id}`);
            if (game_room) return JSON.parse(game_room);
            else return false;
        },
        set: async (id, obj) => await client.redis.call('JSON.SET', `game_room:${id}`, '$', JSON.stringify(obj)),
        remove: async (id) => {
            await client.redis.del(`game_room:${id}`);
            await client.database.game_room.findById(id).remove();
            return true;
        }
    };
    client.database.functions.get_game_room = async (id) => {
        if (!id || !ObjectId.isValid(id)) return false;
        let game_room = await redis_game_room.get(id);
        if (!game_room) {
            game_room = await client.database.game_room.findById(id).lean();
            if (game_room) {
                game_room.id = String(game_room._id);
                delete game_room._id;
                await redis_game_room.set(game_room.id, game_room);
            } else return false;
        }
        if (!game_room.modified) game_room.modified = '';
        game_room.mark_modified = (path) => game_room.modified += `${path}|`;
        game_room.save = async (callback) => {
            await redis_game_room.set(game_room.id, game_room)
                .then(() => callback ? callback(false) : false)
                .catch(() => callback ? callback(true) : false);
            client.redis.sadd(`modified:game_rooms`, game_room.id);
        }
        game_room.remove = async (callback) => {
            await redis_game_room.remove(game_room.id)
                .then(() => callback ? callback(false) : false)
                .catch(() => callback ? callback(true) : false);
        }
        return game_room;
    }
    client.database.functions.create_game_room = async (data) => {
        try {
            let game_room = new client.database.game_room(data);
            await game_room.save();
            game_room = game_room.toObject();
            game_room.id = String(game_room._id);
            delete game_room._id;
            await redis_game_room.set(game_room.id, game_room);
            if (!game_room.modified) game_room.modified = '';
            game_room.mark_modified = (path) => game_room.modified += `${path}|`;
            game_room.save = async (callback) => {
                await redis_game_room.set(game_room.id, game_room)
                    .then(() => callback ? callback(false) : false)
                    .catch(() => callback ? callback(true) : false);
                client.redis.sadd(`modified:game_rooms`, game_room.id);
            }
            game_room.remove = async (callback) => {
                await redis_game_room.remove(game_room.id)
                    .then(() => callback ? callback(false) : false)
                    .catch(() => callback ? callback(true) : false);
            }
            return game_room;
        } catch (err) {
            console.log(err);
            return false;
        }
    }
}
