const mongoose = require("mongoose");

module.exports = mongoose.model("chat", new mongoose.Schema({

    room_id: { type: String, default: null },
    messages: { type: Array, default: []},

}) );