# 🎓 MongoDB + Authentication + Subscriptions: Complete Beginner's Guide

## 👶 **What We're Building (Kid-Friendly Explanation)**

Think of your app like a **magical Korean learning playground**:

1. **🏠 Your House (Frontend)** = The React app users see
2. **🏢 The School (Backend)** = Server that handles all the smart stuff  
3. **📚 The Library (MongoDB)** = Where we store all user info
4. **💳 The Cashier (Stripe)** = Handles money for subscriptions
5. **🔐 The Security Guard (Auth)** = Makes sure only right people get in

---

## 🛠️ **Step 1: Understanding the Big Picture**

### **What is MongoDB?**
```
MongoDB = Like a huge digital filing cabinet
- Instead of papers, it stores "documents" (user info, progress, etc.)
- Documents look like JavaScript objects
- Super fast and flexible
```

### **What is Authentication?**
```
Authentication = Checking "Are you really who you say you are?"
- Like showing ID card to enter a building
- We'll create user accounts with email/password
- Give users a "token" to remember they're logged in
```

### **What are Subscriptions?**
```
Subscriptions = Monthly/yearly payments for premium features
- Free users: Basic features
- Premium users: All the cool stuff
- We use Stripe to handle payments (like PayPal but for businesses)
```

---

## 🎯 **Step 2: The Complete Tech Stack**

### **Frontend (What Users See)**
```
React App (Your current Korean learning app)
├── Login/Register pages
├── Subscription management  
├── Protected premium content
└── User dashboard
```

### **Backend (The Brain)**
```
Node.js + Express Server
├── User authentication (login/register)
├── Subscription management
├── Protected API routes
└── MongoDB connection
```

### **Database (The Memory)**
```
MongoDB Collections:
├── users (email, password, subscription info)
├── subscriptions (plan details, payment status)
├── progress (learning progress per user)
└── content (premium vs free content)
```

---

## 🚀 **Step 3: Setting Up Everything (Baby Steps)**

### **Phase 1: Install Everything We Need**

First, let's add a backend to your project:

```bash
# Create a new folder for backend
mkdir k-learn-backend
cd k-learn-backend

# Initialize Node.js project
npm init -y

# Install all the packages we need
npm install express mongoose bcryptjs jsonwebtoken
npm install cors dotenv helmet morgan
npm install stripe
npm install --save-dev nodemon
```

### **What Each Package Does (Kid Explanation)**
```javascript
// express = Creates the server (like building a house for your app)
// mongoose = Talks to MongoDB (like a translator)
// bcryptjs = Scrambles passwords so hackers can't read them
// jsonwebtoken = Creates special ID cards for logged-in users
// cors = Lets your React app talk to your server
// dotenv = Keeps secrets safe (like hiding diary passwords)
// stripe = Handles money stuff
// nodemon = Restarts server automatically when you change code
```

---

## 📁 **Step 4: Project Structure (How to Organize)**

```
k-learn-interactive/
├── frontend/ (your current React app)
│   ├── src/
│   ├── public/
│   └── package.json
│
└── backend/ (new folder we're creating)
    ├── models/ (database schemas)
    │   ├── User.js
    │   ├── Subscription.js
    │   └── Progress.js
    ├── routes/ (API endpoints)
    │   ├── auth.js
    │   ├── subscriptions.js
    │   └── content.js
    ├── middleware/ (security guards)
    │   └── auth.js
    ├── config/ (settings)
    │   └── database.js
    ├── .env (secret passwords)
    ├── server.js (main server file)
    └── package.json
```

---

## 🗄️ **Step 5: MongoDB Setup (Super Easy)**

### **Option 1: Use Your Local MongoDB**
```bash
# Start your local MongoDB (you said you have it)
mongod

# Create a database for your app
mongo
> use korean-learning-app
> db.users.insertOne({test: "hello"})
> exit
```

### **Option 2: MongoDB Atlas (Cloud - Recommended)**
```
1. Go to mongodb.com/atlas
2. Sign up for free
3. Create a cluster (free tier)
4. Get connection string
5. Much easier than local setup!
```

---

## 🔐 **Step 6: Creating the Backend (Step by Step)**

### **server.js (The Main Brain)**
```javascript
// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware (like security guards checking everyone)
app.use(cors());
app.use(express.json());

// Connect to MongoDB (like opening the library)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/korean-learning-app')
  .then(() => console.log('📚 Connected to MongoDB!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes (like different departments in a building)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/content', require('./routes/content'));

// Start the server (like opening the doors)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### **User Model (How We Store User Info)**
```javascript
// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'inactive'
  },
  stripeCustomerId: String,
  learningProgress: {
    vocabularyCount: { type: Number, default: 0 },
    grammarPatterns: { type: Number, default: 0 },
    cultureSections: { type: Number, default: 0 },
    studyStreak: { type: Number, default: 0 }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Scramble password before saving (like encoding a secret message)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Check if entered password matches stored password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### **Authentication Routes (Login/Register)**
```javascript
// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register new user (like signing up for a library card)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({ email, password, name });
    await user.save();
    
    // Create a token (like giving them an ID card)
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User created successfully!',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscriptionPlan: user.subscriptionPlan
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login user (like showing ID card to enter)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscriptionPlan: user.subscriptionPlan
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

module.exports = router;
```

---

## 💳 **Step 7: Stripe Subscription System**

### **Setting Up Stripe (The Money Handler)**
```javascript
// backend/routes/subscriptions.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const auth = require('../middleware/auth'); // We'll create this
const router = express.Router();

// Create subscription (when user wants to upgrade)
router.post('/create', auth, async (req, res) => {
  try {
    const { priceId } = req.body; // Stripe price ID for the plan
    const user = await User.findById(req.userId);
    
    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating subscription', error: error.message });
  }
});

// Webhook to handle successful payments
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle successful payment
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    
    // Update user subscription status
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (user) {
      user.subscriptionStatus = 'active';
      // Determine plan based on amount paid
      if (invoice.amount_paid === 999) { // $9.99
        user.subscriptionPlan = 'premium';
      } else if (invoice.amount_paid === 1999) { // $19.99
        user.subscriptionPlan = 'pro';
      }
      await user.save();
    }
  }
  
  res.json({received: true});
});

module.exports = router;
```

---

## 🔒 **Step 8: Frontend Integration**

### **Adding Auth to Your React App**
```javascript
// frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: true
  });

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        dispatch({ type: 'LOGIN', payload: data });
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        dispatch({ type: 'LOGIN', payload: data });
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### **Login Component**
```javascript
// frontend/src/components/Login.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let result;
    if (isRegister) {
      result = await register(name, email, password);
    } else {
      result = await login(email, password);
    }
    
    setMessage(result.message);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isRegister ? 'Sign Up' : 'Sign In'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          {isRegister ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      
      <p className="mt-4 text-center">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-blue-600 hover:underline"
        >
          {isRegister ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
      
      {message && (
        <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

export default Login;
```

---

## 🌐 **Step 9: Hosting Your App**

### **Option 1: Free Hosting (Perfect for Starting)**
```bash
# Frontend: Vercel (Free, Perfect for React)
npm install -g vercel
cd frontend
vercel

# Backend: Railway/Render (Free tier)
# Just connect your GitHub repo and deploy!

# Database: MongoDB Atlas (Free 512MB)
# Already set up in Step 5
```

### **Option 2: VPS Hosting (More Control)**
```bash
# Rent a server from DigitalOcean ($5/month)
# Install Node.js, MongoDB, and Nginx
# More complex but gives you full control
```

---

## 📝 **Step 10: Environment Variables (.env file)**

```bash
# backend/.env
MONGODB_URI=mongodb://localhost:27017/korean-learning-app
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PORT=5000
```

---

## 🎯 **Step 11: Testing Everything**

### **Test User Registration**
```bash
# Start your backend
cd backend
npm run dev

# Test with curl or Postman
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### **Test Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🎉 **Final Project Structure**

```
k-learn-interactive/
├── frontend/ (React app)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Subscription.js
│   │   │   └── ProtectedContent.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   └── App.js
│   └── package.json
│
├── backend/ (Node.js server)
│   ├── models/
│   │   ├── User.js
│   │   └── Subscription.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── subscriptions.js
│   ├── middleware/
│   │   └── auth.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
└── docs/
    ├── MONETIZATION_STRATEGY.md
    └── API_DOCUMENTATION.md
```

---

## 💝 **You're Amazing!**

See? It's not that scary when we break it down step by step! You've already built an incredible Korean learning app, and now we're just adding the business layer to it.

**Remember:**
1. **Start small** - Get basic auth working first
2. **Test everything** - Make sure each step works before moving on
3. **Don't rush** - Take your time to understand each piece
4. **Ask questions** - I'm here to help every step of the way!

You've got this! Your Korean learning app is going to be absolutely amazing! 🌟

**Want me to help you implement any specific part first? Maybe we start with the basic authentication system?** 🚀
