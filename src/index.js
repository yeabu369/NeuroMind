const express = require('express');
const app = express();
const path = require('path');

const cookieParser = require("cookie-parser");
const router = require('./router.js');

require('dotenv').config();

const port = process.env.PORT || 3000;

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('Connected to database');
}).catch(() => {
    console.log('Connection failed');
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use(cookieParser());
app.use('/', router);


app.listen(port, () => {
    console.log(`Server is running on port ${port}, http://localhost:${port}`);
});










