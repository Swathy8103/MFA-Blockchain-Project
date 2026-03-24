// /server/routes/authRoutes.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/user');
const router = express.Router();
const path = require('path');

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure this folder exists
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Signup Route
router.post('/signup', upload.array('images', 9), async (req, res) => {
    const { username, pin, imageOrder } = req.body;
    if (!req.files || req.files.length !== 9) {
        return res.status(400).json({ message: 'Exactly 9 images are required.' });
    }

    // Convert imageOrder to array if it's a string
    let parsedImageOrder;
    if (typeof imageOrder === 'string') {
        parsedImageOrder = imageOrder.split(',').map(Number);
    } else {
        parsedImageOrder = imageOrder;
    }

    if (parsedImageOrder.length !== 3) {
        return res.status(400).json({ message: 'Exactly 3 images must be selected in order.' });
    }

    try {
        const hashedPin = await bcrypt.hash(pin, 10);

        const user = new User({
            username,
            pin: hashedPin,
            images: req.files.map(file => file.filename),
            imageOrder: parsedImageOrder // Store image indices
        });

        await user.save();
        res.status(201).json({ message: 'User created' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login Route (Image-based and PIN validation)
router.post('/login', async (req, res) => {
    const { username, pin, imageSelection } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(pin, user.pin)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check image order
        if (JSON.stringify(imageSelection) !== JSON.stringify(user.imageOrder)) {
            return res.status(401).json({ message: 'Image selection incorrect' });
        }

        const token = jwt.sign({ userId: user._id }, 'secretkey', { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to Get User Images
router.get('/getUserImages', async (req, res) => {
    const { username } = req.query;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Assuming you're serving images statically from /uploads
        const imageUrls = user.images.map(filename => `/uploads/${filename}`);
        res.status(200).json({ images: imageUrls });
    } catch (error) {
        console.error('Error fetching user images:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
