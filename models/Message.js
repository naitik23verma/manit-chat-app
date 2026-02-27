const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { type: String, required: true }, // studentId/uid
    senderName: { type: String },
    content: { type: String, required: true },
    chatId: { type: String, required: true }, // Can be groupId or a combined ID for 1-1
    type: { type: String, enum: ['text', 'image'], default: 'text' },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
