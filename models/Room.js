const mongoose = require("mongoose");

module.exports = mongoose.model("room", new mongoose.Schema({

    name: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: 'active' },
    type: { type: String, default: 'private' },

    members: { type: Array, default: [] },

    chat_id: { type: String, default: null }

}) );