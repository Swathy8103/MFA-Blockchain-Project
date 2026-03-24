// /server/models/user.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    pin: { type: String, required: true },  // Hashed PIN
    images: { type: [String], required: true },  // List of image filenames
    imageOrder: { type: [Number], required: true }  // Array storing the order of selected images (e.g., [2, 5, 7])
});

module.exports = mongoose.model('User', UserSchema);
