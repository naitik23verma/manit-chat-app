const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true }, // employeeNumber/uid
    fullName: { type: String, required: true },
    rollNo: { type: String, required: true },
    email: { type: String },
    department: { type: String },
    photoUrl: { type: String },
    lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
