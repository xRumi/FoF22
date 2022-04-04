const mongoose = require("mongoose");

module.exports = mongoose.model("chat", new mongoose.Schema({

    room_id: { type: String, default: null },
    messages: { type: Array, default: [
        {
            id: Math.random().toString(36).substring(2, 15),
            user: '61d001de9b64b8c435985da9',
            message: 'This is the beginning of this chat',
            time: Date.now(),
            seen_by: []
        }
    ]},

}) );