const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();

const port = process.env.PORT || 3000;

const mongoose = require('mongoose');

mongoose.connect(
    "mongodb+srv://yeabu:vx7XMwZQPAX6jIc2@neuromind.rd2r5vn.mongodb.net/?retryWrites=true&w=majority"
).then(() => {
    console.log('Connected to database');
}).catch(() => {
    console.log('Connection failed');
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}, http://localhost:${port}`);
});
