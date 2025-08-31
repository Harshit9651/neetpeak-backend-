const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const path = require('path');
app.set('view engine', 'ejs');
const cors = require('cors')
const Razorpay = require('razorpay');
const crypto = require('crypto');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
const corsOptions = require("./config/corsOptions.js");
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});


app.set('trust proxy', true);
require("./jobs/otpCleaner");

const connectDB =require('./DataBase/connection.js')
connectDB()
app.use(cors(corsOptions));
const Routes = require('./Routes/index.js')
app.use('/api/v1',Routes)






