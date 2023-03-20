const express= require('express');
const router = express.Router();

const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const User = require('../models/user');



router.get('/', async (req, res) => {
  try {
      res.sendFile(path.join(__dirname, '../public', 'index.html'));
  }
  catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


router.get('/signup', async (req, res) => {
  try {
      res.sendFile(path.join(__dirname, '../public', 'signup.html'));
  }
  catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

router.get('/login', async (req, res) => {
  try {
      res.sendFile(path.join(__dirname, '../public', 'login.html'));
  }
  catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});



router.post('/signup', async (req, res) => {
  try {
      const { email, password } = req.body;
      console.log(email, password);
  
      const existingUser = await User.findOne({ eamil });
      if (existingUser) {
        return res.status(400).send('Username already taken');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ email, password: hashedPassword });
      await newUser.save();
  
      res.send('User created successfully');
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
  
      res.sendFile(path.join(__dirname, '../public', 'index.html'));
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
 
});


module.exports = router;
