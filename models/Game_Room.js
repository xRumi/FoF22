const mongoose = require("mongoose");

module.exports = mongoose.model("game_room", new mongoose.Schema({
    name: { type: String, required: true },
    host: { type: String, required: true },
    players: { type: Array, default: [] },
    player_limit: { type: Number, default: 20 },
    messages: { type: Array, default: [] },
    leaderboard: { type: Array, default: [] },
    private: { type: Boolean, default: false },
    games: { type: Array, default: [] },
}) );
