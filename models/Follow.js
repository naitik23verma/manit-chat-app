const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
    followerId: { type: String, required: true },
    followingId: { type: String, required: true },
});

module.exports = mongoose.model('Follow', FollowSchema);
