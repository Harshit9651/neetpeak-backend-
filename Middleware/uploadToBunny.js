const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const uploadHLSFolderToBunny = async (localFolderPath, courseName, videoName) => {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  const remotePath = `${courseName}/${videoName}`;

  try {
    await client.access({
      host: process.env.BUNNY_STORAGE_HOST,
      user: process.env.BUNNY_STORAGE_USERNAME,
      password: process.env.BUNNY_STORAGE_PASSWORD,
      secure: false,
    });

    await client.ensureDir(remotePath);
    await client.clearWorkingDir();
    await client.uploadFromDir(localFolderPath);

    const masterUrl = `${process.env.BUNNY_PULL_ZONE_URL}/${courseName}/${videoName}/master.m3u8`;

    return {
      success: true,
      url: masterUrl,
    };
  } catch (err) {
    console.error("Bunny upload error:", err);
    return { success: false, error: err.message };
  } finally {
    client.close();
  }
};

module.exports = { uploadHLSFolderToBunny };
