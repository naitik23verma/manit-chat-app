const mongoose = require('mongoose');

const CommunityStorySchema = new mongoose.Schema({
    authorId: { type: String, required: true },
    authorPhoto: { type: String },
    mediaUrl: { type: String, required: true },
    expiresAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 } // Default 24 hours
}, { timestamps: true });

module.exports = mongoose.model('CommunityStory', CommunityStorySchema);
