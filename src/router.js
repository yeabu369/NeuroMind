const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")
const User = require('../models/user');
const { Configuration, OpenAIApi } = require("openai");
const { access } = require('fs');

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);


const router = express.Router();

const hitcount = {
  home: 0,
  landing: 0,
  generate: 0,
}


router.use(express.json());

router.get('/', async (req, res) => {
  try {
    hitcount.landing += 1;
    res.cookie("hitcount", hitcount)
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

const checkAuth = (req, res, next) => {
  
  if (req.cookies && req.cookies.authorization) { 
    const token = req.cookies.authorization;
    if (!token) {
      return res.redirect('/login');
    }
    try {
      const decodedToken = jwt.verify(token, SECRET_KEY);
     req.user = decodedToken; // Set the req.user property to the decoded token
      next();
    } catch (err) {
      return res.redirect('/login');
    }
  } else {
    return res.status(401).redirect('/login');
  }
}


router.get('/home',checkAuth, async (req, res) => {
 try {
    hitcount.home += 1;
     res.cookie("hitcount", hitcount )
     console.log("home")
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
      return res.status(400).sendFile(path.join(__dirname, '../public/html', 'signup.html'));
    }


    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
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

    const user = await User.findOne({ email });
    if (!user) {
      res.sendFile(path.join(__dirname, '../public/html', 'login.html'));

      //res.json({ success: false, message: 'User does not exist' });
      return;
    }

     const isPasswordValid = await bcrypt.compare(password, user.password);
   
    if (!isPasswordValid) {
      res.sendFile(path.join(__dirname, '../public/html', 'login.html'));
 
     // res.json({ success: false, message: 'Incorrect password' });
      return;
    }


    const result = user.toObject();
    delete result.password;

    const token = jwt.sign(result, SECRET_KEY, { expiresIn: '1h' })
 
    req.cookies = {authorization: token}
    

     res.cookie("authorization", token, { httpOnly: true })
    //res.sendFile(path.join(__dirname, '../public/html', 'main.html'));
     res.redirect('/home');
 //   res.json({ success: true, message: 'Login successful' })
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }

});

router.post('/logout', async (req, res) => {
  try {
    res.cookie("authorization", false)
    res.redirect('/home');
   // res.sendFile(path.join(__dirname, '../public/html', 'index.html'));
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
    hitcount.generate += 1;

    res.cookie("hitcount", hitcount)
    console.log(completion.data.choices[0].message.content);

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

router.post("/text2speech", async (req, res) => { });


module.exports = router;
