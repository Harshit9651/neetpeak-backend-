const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.cloudinary_CLOUD_NAME,
  api_key: process.env.cloudinary_API_KEY,
  api_secret: process.env.cloudinary_API_SECRATE,
});

const deleteFromCloudinary = async (fileUrl, resourceType = "image") => {
  try {
    if (!fileUrl) throw new Error("No file URL provided.");

    const urlParts = fileUrl.split("/");
    const fileNameWithExt = urlParts[urlParts.length - 1];
    const folderName = urlParts[urlParts.length - 2];

    const publicId = fileNameWithExt.split(".")[0];
    const fullPublicId = `${folderName}/${publicId}`;

   
    const result = await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: resourceType,
    });

    if (result.result !== "ok" && result.result !== "not found") {
      console.warn("Unexpected Cloudinary deletion result:", result);
    }

    return result;
  } catch (error) {
    console.error("❌ Cloudinary deletion error:", error.message);
    throw error;
  }
};

module.exports = {
  deleteFromCloudinary,
};
