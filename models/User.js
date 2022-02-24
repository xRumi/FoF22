const mongoose = require("mongoose");

module.exports = mongoose.model("user", new mongoose.Schema({

    username: { type: String, unique: true },
    password: { type: String },

    name: { type: String },
    email: { type: String, unique: true },

    created_at: { type: Date, default: Date.now },
    status: { type: String, default: 'active' },

    friends: { type: Array, default: [] },
    rooms: { type: Array, default: [] },

    activity_status: { type: String, default: 'offline' }

}) );