const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session')
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const userRoute = require('./routes/userRoutes')

mongoose.connect(process.env.DB_URL)
    .then(() => console.log('DB Connected..!'))
    .catch((err) => console.log(err))

app.use(cors({
    origin: ['http://localhost:4200', 'https://mt-frontend-three.vercel.app']
}));
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/file', express.static('public'))
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true
}))

app.use('/', userRoute)

app.listen(3030, () => console.log('Server Connected..!'))