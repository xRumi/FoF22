const mongoose = require("mongoose");

module.exports = mongoose.model("chat", new mongoose.Schema({

    room_id: { type: String, default: null },
    
    messages: { type: Array, default: [{
        user: 'system',
        message: `room created`,
        time: Date.now(),
        seen_by: []
    }]},

}) );