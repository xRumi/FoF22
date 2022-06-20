const mongoose = require("mongoose");

module.exports = mongoose.model("user", new mongoose.Schema({

    username: { type: String, unique: true },
    password: { type: String },

    name: { type: String },
    email: { type: String, unique: true },

    // "Name" : { value: "value",
    //            type: 'public/friends-only/private',
    //            category: 'bio/myself/contact' };
    profile_data: { type: Object },

    created_at: { type: Date, default: Date.now },
    deleted_at: { type: Date },
    delete_requested_at: { type: Date },
    deactived_at: { type: Date },
    account_status: { type: String, default: 'active' },

    presence_type: { type: String, default: 'friends-only' },
    hide_presence: { type: Boolean },

    friends: { type: Array },
    rooms: { type: Array },

    friend_requests: { type: Array },
    notifications: { type: Array },

    login_retry: { type: Number },

    ip_info: {},
    location: {
        type: { type: String },
        coordinates: [],
    },
    exclude_nearby: { type: Array },
    last_location_change: { type: Date }

}).index({ location: "2dsphere" }) );
