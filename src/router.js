const express= require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser");
const User = require('../models/user');
const { Configuration, OpenAIApi } = require("openai");

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);


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


router.get('/home', async (req, res) => {
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
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!user) {
    
       res.json({ success: false, message: 'User does not exist' });
      return;
      }
      // Check if password is correct
       if (!isPasswordValid) { 
       res.json({ success: false, message: 'Incorrect password' });
      return;
      }
        
        
      const result = user.toObject();
      delete result.password;

      const token = jwt.sign(result, SECRET_KEY, { expiresIn: '1h'})
     
        res.cookie("authorization", token, { httpOnly: true })
       res.json({ success: true, message: 'Login successful' })
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

router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
    });

    console.log(completion.data.choices[0].text);

    res.status(200).json({ result: completion.data.choices[0].message.content });
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.',
        }
      });
    }
  }
});

module.exports = router;
