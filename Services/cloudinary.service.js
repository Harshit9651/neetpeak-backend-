const cloudinary = require("cloudinary").v2;
require
cloudinary.config({
  cloud_name: process.env.cloudinary_CLOUD_NAME,
  api_key: process.env.cloudinary_API_KEY,
  api_secret: process.env.cloudinary_API_SECRATE,
});

const uploadToCloudinary = (fileBuffer, filename, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "uploads",
        public_id: filename?.split(".")[0] + "-" + Date.now(),
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    ).end(fileBuffer);
  });
};

module.exports = { uploadToCloudinary };
