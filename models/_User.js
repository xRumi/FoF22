const mongoose = require("mongoose");

module.exports = mongoose.model("_user", new mongoose.Schema({

    username: { type: String, unique: true },

    verified: { type: Boolean, default: false },

    name: { type: String },
    email: { type: String, unique: true },

    created_at: { type: Date, default: Date.now }

}) );