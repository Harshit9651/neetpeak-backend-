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
// require("./jobs/otpCleaner");

const connectDB =require('./DataBase/connection.js')
connectDB()
app.use(cors(corsOptions));
const Routes = require('./Routes/index.js')
app.use('/api/v1',Routes)






const users = require("./Models/Student/registerStudentModel.js")
const cleanusersmodl = async()=>{
    try{
       const deletedUsers =  await users.deleteMany({})
       console.log(`Deleted ${deletedUsers.deletedCount} users`);
    }catch(err){
        console.log(err)
    }   

}
// cleanusersmodl()
require("dotenv").config();
const axios = require("axios");

const seeToken = async () => {
  try {
    const loginRes = await axios.post(
      "https://cp.expressfly.in/2.1/api-login",   //
      {
        email:'neetpeak.delevery@gmail.com',         
        password: '7891858821'     
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Login Success ✅");
    console.log("Token:", loginRes.data?.data?.token);
  } catch (err) {
    console.error("Login error:", err.response?.status, err.response?.data || err.message);
  }
};

// seeToken();
