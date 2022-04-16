const mongoose = require("mongoose");

module.exports = mongoose.model("user", new mongoose.Schema({

    username: { type: String, unique: true },
    password: { type: String },

    name: { type: String },
    email: { type: String, unique: true },

    user_info: { type: Object, default: {
        nickname: null,
        age: null,
        gender: null,
        bod: null,
        hobby: null,
        relationship: null,
        religion: null,
        about_myself: null,
        current_address: null,
        permanent_address: null,
        mobile_number: [],
        email_address: null,
        _hide: []
    } },

    created_at: { type: Date, default: Date.now },
    status: { type: String, default: 'active' },

    friends: { type: Array, default: [] },
    rooms: { type: Array, default: [] },

}) );