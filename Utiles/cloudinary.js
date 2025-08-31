require('dotenv').config()
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.cloudinary_CLOUD_NAME, 
  api_key: process.env.cloudinary_API_KEY,
  api_secret:process.env.cloudinary_API_SECRATE ,
});

module.exports = cloudinary;
