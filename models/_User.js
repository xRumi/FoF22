const mongoose = require("mongoose");

module.exports = mongoose.model("_user", new mongoose.Schema({

    verified: { type: Boolean, default: false },
    email: { type: String, unique: true },

    created_at: { type: Date, default: Date.now }

}) );