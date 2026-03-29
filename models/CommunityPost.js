const mongoose = require('mongoose');

const CommunityPostSchema = new mongoose.Schema({
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorPhoto: { type: String },
    content: { type: String, required: true },
    codeSnippet: { type: String },
    language: { type: String, default: 'javascript' },
    githubLink: { type: String },
    deploymentLink: { type: String },
    likes: { type: [String], default: [] }, // Array of studentIds
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);
