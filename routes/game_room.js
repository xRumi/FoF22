const router = require('express').Router();

module.exports = (client) => {

    router.get('/list', async (req, res) => {
        if (req.user) {
            const game_rooms = await client.database.game_room.find().lean();
            res.status(200).send(game_rooms.map(x => ({
                id: String(x._id),
                name: x.name,
                is_host: x.host == req.user.id,
                player_count: x.players.length,
                player_limit: x.player_limit
            })));
        } else res.sendStatus(403);
    });

    router.get('/list-joined', async (req, res) => {
        if (req.user) {
            const game_rooms = await client.database.game_room.find({ players: req.user.id }).lean();
            res.status(200).send(game_rooms.map(x => ({
                id: String(x._id),
                name: x.name,
                is_host: x.host == req.user.id,
                is_private: x.private,
                player_count: x.players.length,
                player_limit: x.player_limit
            })));
        } else res.sendStatus(403);
    });

    return router;
}
