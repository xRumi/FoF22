const mongoose = require("mongoose");

module.exports = mongoose.model("user", new mongoose.Schema({

    username: { type: String, unique: true },
    password: { type: String },

    name: { type: String },
    email: { type: String, unique: true },

    profile_data: { type: Object, default: {
        "Nickname": { value: null, type: 'public', category: 'bio' },
        "Gender": { value: null, type: 'public', category: 'bio' },
        "Birth Of Date": { value: null, type: 'public', category: 'bio' },
        "Hobby": { value: null, type: 'public', category: 'bio' },
        "Relationship": { value: null, type: 'public', category: 'bio' },
        "Religion": { value: null, type: 'public', category: 'bio' },
        "About Myself": { value: null, type: 'public', category: 'myself' },
        "Current Address": { value: null, type: 'public', category: 'contact' },
        "Permanent Address": { value: null, type: 'public', category: 'contact' },
        "Mobile Number": { value: [], type: 'public', category: 'contact' },
        "Email Address": { value: [], type: 'public', category: 'contact' },
    } },

    created_at: { type: Date, default: Date.now },
    status: { type: String, default: 'active' },

    friends: { type: Array, default: [] },
    rooms: { type: Array, default: [] },

    friend_requests: { type: Array, default: [] },
    notifications: { type: Array, default: [] },

    login_retry: { type: Number, default: 0 }

}) );
