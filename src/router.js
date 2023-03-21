const express= require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser");


require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

const User = require('../models/user');

const router = express.Router();

router.use(express.json());

router.get('/', async (req, res) => {
  try {
      res.sendFile(path.join(__dirname, '../public/html', 'index.html'));
  }
  catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


router.get('/login', async (req, res) => {
  try {
      res.sendFile(path.join(__dirname, '../public/html', 'login.html'));
  }
  catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

router.get('/signup', async (req, res) => {
  try {
      res.sendFile(path.join(__dirname, '../public/html', 'signup.html'));
  }
  catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

const authMiddleware = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    // Check if the authorization header is present
    if (!authHeader) {
      return res.status(401).send('Unauthorized');
    }

    // Split the authorization header to get the token
    const [_, token] = authHeader.split(' ');

    // Verify the token
    const decoded = jwt.verify(token, SECRET_KEY);

    // Add the user object to the request object
    req.user = decoded;

    // Call the next middleware function
    next();
  } catch (error) {
    console.error(error);
    res.status(401).send('Unauthorized');
  }
};


router.get('/home',authMiddleware, async (req, res) => {
  try {
      res.sendFile(path.join(__dirname, '../public/html', 'main.html'));
  }
  catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


router.post('/signup', async (req, res) => {
  try {
      const { email, password, name } = req.body;
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).send('Username already taken');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name,email, password: hashedPassword });
      await newUser.save();
      
      res.sendFile(path.join(__dirname, '../public/html', 'login.html'));
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
});

router.post('/login', async (req, res) => {
  try {
      const { email, password } = req.body;
  
      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).send('Invalid username or password');
      }
      // Check if password is correct
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).send('Invalid username or password');
      }
      const result = user.toObject();
      delete result.password;

      const token = jwt.sign(result, SECRET_KEY, { expiresIn: '1h'})
     
        res.cookie("authorization", token, { httpOnly: true })
        res.sendFile(path.join(__dirname, '../public/html', 'main.html'));
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
 
});

router.post('/logout', async (req, res) => {
  try {
        res.cookie("authorization", false )
        res.sendFile(path.join(__dirname, '../public/html', 'index.html'));
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
 
});



module.exports = router;