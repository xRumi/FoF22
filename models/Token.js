const mongoose = require("mongoose");

module.exports = mongoose.model("token", new mongoose.Schema({

    user_id: { type: String, required: true },
    type: { type: String, default: 'reset-token' },
    expire_at: { type: Date, default: Date.now() + 8.64e+7 },
    created_at: { type: Date, default: Date.now() },

    mailed: { type: Number, default: 0 }

}) );