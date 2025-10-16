// server.js

// --- Imports ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
require('dotenv').config(); // To manage environment variables

// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

// --- Middleware ---
app.use(cors()); // Allows requests from our frontend
app.use(express.json()); // Parses incoming JSON requests

// --- MongoDB Connection ---
// It's recommended to use an environment variable for your connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sahyog-medical?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas ---
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    address: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: '' }
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true }
    }],
    totalPrice: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);

// --- Authentication Middleware ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Add user payload to request
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user && user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ message: 'Admin access required.' });
        }
    } catch(error){
        return res.status(500).json({ message: 'Error checking admin status.' });
    }
};


// --- API Routes ---

// 1. Auth Routes (Public)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User with this email already exists.' });

        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Make first registered user an admin
        const isFirstUser = (await User.countDocuments()) === 0;
        const role = isFirstUser ? 'admin' : 'user';

        const user = new User({ email, password: hashedPassword, role });
        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
        
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ token, user: { id: user._id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});

// 2. User Profile Routes (Protected)
app.get('/api/users/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
});
app.put('/api/users/profile', authMiddleware, async (req, res) => {
    try {
        const { address } = req.body;
        const user = await User.findByIdAndUpdate(req.user.userId, { address }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Profile updated!', user });
    } catch (error) {
         res.status(500).json({ message: 'Server error updating profile.' });
    }
});


// 3. Product Routes
app.get('/api/products', async (req, res) => { // Public
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching products.' });
    }
});

app.post('/api/products', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, price, imageUrl } = req.body;
        const product = new Product({ name, price, imageUrl });
        await product.save();
        res.status(201).json(product);
    } catch(error){
         res.status(500).json({ message: 'Server error creating product.' });
    }
});

app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, price, imageUrl } = req.body;
        const product = await Product.findByIdAndUpdate(req.params.id, { name, price, imageUrl }, { new: true });
        if(!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch(error) {
        res.status(500).json({ message: 'Server error updating product.' });
    }
});

app.delete('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if(!product) return res.status(404).json({ message: 'Product not found' });
        res.status(204).send(); // No content to send back
    } catch(error) {
        res.status(500).json({ message: 'Server error deleting product.' });
    }
});

// 4. Order Routes
app.get('/api/orders', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'email').populate('products.product', 'name');
        res.json(orders);
    } catch(error) {
        res.status(500).json({ message: 'Server error fetching orders.' });
    }
});

app.post('/api/orders', authMiddleware, async (req, res) => {
    try {
        const { products, totalPrice } = req.body;
        if (!products || products.length === 0) {
            return res.status(400).json({ message: 'Cannot place an empty order.' });
        }
        const order = new Order({
            user: req.user.userId,
            products,
            totalPrice
        });
        await order.save();
        res.status(201).json({ message: 'Order placed successfully!', order });
    } catch(error) {
        res.status(500).json({ message: 'Server error placing order.' });
    }
});


// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

