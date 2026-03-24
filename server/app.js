const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const session = require('express-session'); 
const app = express();
const uploadDir = path.join(__dirname, 'uploads'); // Define upload directory

// Check if the uploads directory exists, if not, create it
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('Uploads directory created.');
}

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/uploads')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

// Define User Schema
const userSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    pin: {
        type: String,
        required: true
    },
    images: {
        type: [String], // Store image paths
        required: true
    },
    imageOrder: {
        type: [Number], // Store the order of images (index-based)
        required: true
    }
});

const User = mongoose.model('User', userSchema);

// Define Transaction Schema
const transactionSchema = new mongoose.Schema({
    accountNo: {
        type: String,
        required: true
    },
    transactionDetails: {
        type: String,
        required: true
    },
    chqNo: {
        type: String,
        required: false
    },
    valueDate: {
        type: Date,
        required: true
    },
    withdrawalAmt: {
        type: Number,
        required: true
    },
    depositAmt: {
        type: Number,
        required: true
    },
    balanceAmt: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Use the 'uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Create a unique filename
    }
});

const upload = multer({ storage: storage });
app.use(session({ secret: 'secret_key', resave: false, saveUninitialized: true })); // Configure sessions

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve images from the uploads directory
app.use('/uploads', express.static(uploadDir)); // Serve images from uploads

// Middleware to handle form submissions
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Signup route to handle image upload and user registration
app.post('/signup', upload.array('images', 9), async (req, res) => {
    const { accountNumber, username, pin, confirmPin, imageOrder } = req.body;
    const files = req.files;

    // Validate that the PIN and confirm PIN match
    if (pin !== confirmPin) {
        return res.status(400).send('PIN and Confirm PIN do not match.');
    }

    if (!files || files.length === 0) {
        return res.status(400).send('No images were uploaded.');
    }

    if (!imageOrder) {
        return res.status(400).send('Image order not provided.');
    }

    const imagePaths = files.map(file => file.path); // Get paths of uploaded images

    // Ensure the user selects exactly 3 images in order
    const selectedOrder = imageOrder.split(',').map(Number);
    if (selectedOrder.length !== 3 || selectedOrder.some(num => num >= files.length || num < 0)) {
        return res.status(400).send('Invalid image order. Please select exactly 3 images in order.');
    }

    // Create a new user with the uploaded image paths and selected image order
    const newUser = new User({
        accountNumber: accountNumber,
        username: username,
        pin: pin,
        images: imagePaths,
        imageOrder: selectedOrder // Convert the order to an array of numbers
    });

    try {
        await newUser.save();
        // Redirect to login.html upon successful signup
        res.redirect('/login.html');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during signup.');
    }
});

// Login route to fetch user data
app.post('/login', async (req, res) => {
    const { username, pin } = req.body;

    try {
        const user = await User.findOne({ username: username, pin: pin });

        if (user) {
            // Respond with user images if credentials are correct
            const fullImagePaths = user.images.map(image => {
                return `/uploads/${path.basename(image)}`; // Relative URL for serving images
            });

            res.json({ images: fullImagePaths });
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during login');
    }
});

app.post('/validate-selection', async (req, res) => {
    const { username, selectedImages } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Get the correct order of images based on stored imageOrder
        const correctOrder = user.imageOrder.map(index => user.images[index]);
        const correctOrderPaths = correctOrder.map(image => path.join('/uploads', path.basename(image))).map(p => p.replace(/\\/g, '/').replace(/ /g, '%20'));

        // Decode selected images
        const decodedSelectedImages = selectedImages.map(image => decodeURIComponent(image));

        console.log('User Selected Images:', decodedSelectedImages);
        console.log('Correct Order Paths:', correctOrderPaths);

        // Normalize the paths to compare them
        const normalizedSelectedImages = decodedSelectedImages.map(img => img.replace('http://localhost:3000', '').replace(/ /g, '%20'));

        // Log the normalized paths for debugging
        console.log('Normalized Selected Images:', normalizedSelectedImages);

        // Check if the selected images match the correct order
        const isCorrect = JSON.stringify(normalizedSelectedImages) === JSON.stringify(correctOrderPaths);
        if (isCorrect) {
            // Optionally, you can store the user's login state in the session
            req.session.username = username; // Store username in session

            return res.json({ success: true, message: 'Selection is correct! Login successful.' }); // Send success response
        } else {
            return res.json({ success: false, message: 'Incorrect selection. Please try again.' }); // Send failure response
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during selection validation');
    }
});


// Add Transaction Route
app.post('/add-transaction', async (req, res) => {
    const { accountNo, transactionDetails, chqNo, valueDate, withdrawalAmt, depositAmt } = req.body;

    // Calculate the balance amount
    const balanceAmt = depositAmt - withdrawalAmt;

    const newTransaction = new Transaction({
        accountNo,
        transactionDetails,
        chqNo,
        valueDate,
        withdrawalAmt,
        depositAmt,
        balanceAmt
    });

    try {
        await newTransaction.save();
        res.json({ message: 'Transaction added successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while adding the transaction.');
    }
});

// Fetch Transaction History
app.get('/transaction-history', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 }); // Fetch latest transactions first
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while fetching transaction history.');
    }
});

// Serve the signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/signup.html')); // Ensure this points to your actual signup HTML file
});

// Serve the transaction page
app.get('/transaction', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/transaction.html')); // Ensure this points to your actual transaction HTML file
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
