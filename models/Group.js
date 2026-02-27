const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: String, required: true }, // studentId
    members: [{ type: String }], // Array of studentIds
    image: { type: String } // Group icon
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);
