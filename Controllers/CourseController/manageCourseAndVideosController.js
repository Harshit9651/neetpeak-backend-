const Course = require("../../Models/Course/createCourse");
const Video = require("../../Models/Course/courseVideos");
const Playlist = require("../../Models/Course/Playlist");
const PurchasedCourse = require("../../Models/Course/PurchasedCourse");
const CourseProgress = require("../../Models/Course/courseProgress");
const ftp = require("basic-ftp");
const mongoose = require("mongoose");
const { uploadToCloudinary } = require("../../Services/cloudinary.service");
const { deleteFromCloudinary } = require("../../Services/cloudinary");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
require("dotenv").config();
ffmpeg.setFfmpegPath(ffmpegPath);
const { uploadHLSFolderToBunny } = require("../../Middleware/uploadToBunny");

exports.addCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      mrp,
      isFree,
      validityInDays,
      estimatedDuration,
      tags,
      level,
      slug,
      validity,
    } = req.body;

    if (
      !title ||
      !description ||
      !req.file ||
      !estimatedDuration ||
      !validityInDays
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields (title, description, image, validity, or duration).",
      });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG, or WEBP image types are allowed.",
      });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image size should be less than 5MB.",
      });
    }
    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      "image"
    );
    const imageUrl = result.secure_url;

    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch (err) {
        parsedTags = [];
      }
    }

    const newCourse = new Course({
      title,
      content: description,
      price: isFree === "true" ? 0 : Number(price),
      mrp: Number(mrp),
      duration: validityInDays,
      courseLevel: level,
      tags: parsedTags,
      image: imageUrl,
      status: "Draft",
    });

    const SaveCourse = await newCourse.save();
    return res.status(201).json({
      success: true,
      message: "Course successfully created.",
      data: newCourse,
    });
  } catch (error) {
    console.error("Course creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      data: course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { courseId, title, content, price } = req.body;

    if (!courseId || !title || !content || !price) {
      return res.status(400).json({
        success: false,
        message: "All fields (courseId, title, content, price) are required.",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    let imageUrl = course.image;

    if (req.file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, PNG, or WEBP image types are allowed.",
        });
      }

      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Image size should be less than 2MB.",
        });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        "image"
      );
      imageUrl = result.secure_url;
    }

    course.title = title;
    course.content = content;
    course.price = Number(price);
    course.image = imageUrl;

    const updatedCourse = await course.save();
    return res.status(200).json({
      success: true,
      message: "Course successfully updated.",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error in updateCourse:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.listCourses = async (req, res) => {
  try {
    const courses = await Course.find({})
      .select("title content price image lectures createdAt status courseLevel")
      .sort({ createdAt: -1 });

    const totalCount = await Video.countDocuments({});

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully.",
      data: courses,
      totalVideos: totalCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses.",
      error: error.message,
    });
  }
};
exports.listAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully.",
      data: courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses.",
      error: error.message,
    });
  }
};

exports.updateCourseVideo = async (req, res) => {
  try {
    const { title, description } = req.body;
    const videoId = req.params.videoId;

    if (!videoId || !title || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    let updatedHLSUrl = video.HLSLVideoUrl;
    let updatedThumbnail = video.thumbnail;
    let generatedResolutions = video.resolutions;

    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];
    if (videoFile) {
      const tempVideoPath = path.join(
        os.tmpdir(),
        `video_${Date.now()}_${videoFile.originalname}`
      );
      const outputDir = path.join(os.tmpdir(), `hls_output_${Date.now()}`);
      fs.writeFileSync(tempVideoPath, videoFile.buffer);
      fs.mkdirSync(outputDir, { recursive: true });

      try {
        generatedResolutions = await convertToHLS(tempVideoPath, outputDir);

        const timestamp = Date.now().toString();
        const {
          success,
          url: hlsUrl,
          error: uploadError,
        } = await uploadHLSFolderToBunny(outputDir, video.course, timestamp);
        if (!success) throw new Error(`Bunny Upload Failed: ${uploadError}`);

        updatedHLSUrl = hlsUrl;
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: "Failed HLS conversion or upload",
          error: err.message,
        });
      } finally {
        cleanupTempFiles([tempVideoPath, outputDir]);
      }
    }
    if (thumbnailFile) {
      const uploadedThumb = await uploadToCloudinary(
        thumbnailFile.buffer,
        thumbnailFile.originalname,
        "image"
      );
      updatedThumbnail = uploadedThumb.secure_url;
    }
    video.title = title.trim();
    video.description = description.trim();
    video.HLSLVideoUrl = updatedHLSUrl;
    video.thumbnail = updatedThumbnail;
    video.resolutions = generatedResolutions;

    const updated = await video.save();

    return res.status(200).json({
      success: true,
      message: "Video updated successfully with HLS",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update video",
      error: err.message,
    });
  }
};

exports.deleteCourseVideo = async (req, res) => {
  try {
    const videoId = req.params.videoId;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Video ID is required",
      });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    if (video.thumbnail) {
      await deleteFromCloudinary(video.thumbnail, "image");
    }

    if (video.HLSLVideoUrl) {
      const hlsFolderPath = extractBunnyFolderPath(video.HLSLVideoUrl);

      const client = new ftp.Client();
      client.ftp.verbose = false;

      try {
        await client.access({
          host: process.env.BUNNY_STORAGE_HOST,
          user: process.env.BUNNY_STORAGE_USERNAME,
          password: process.env.BUNNY_STORAGE_PASSWORD,
          secure: false,
        });

        await client.removeDir(hlsFolderPath);
      } catch (ftpErr) {
        console.error("❌ Failed to delete from BunnyCDN:", ftpErr.message);
        return res.status(500).json({
          success: false,
          message: "Failed to delete HLS folder from BunnyCDN",
          error: ftpErr.message,
        });
      } finally {
        client.close();
      }
    }
    await Video.findByIdAndDelete(videoId);

    return res.status(200).json({
      success: true,
      message: "Video and assets deleted successfully",
    });
  } catch (err) {
    console.error("❌ Error deleting video:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting video",
      error: err.message,
    });
  }
};

exports.getCourseVideos = async (req, res) => {
  try {
    const { courseId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    if (!courseId) {
      return res
        .status(400)
        .json({ success: false, message: "courseId is required." });
    }

    const skip = (page - 1) * limit;
    const allVideos = await Video.find({ course: courseId })
      .populate("playlist", "title thumbnail")
      .sort({ uploadedAt: 1 });

    const playlistMap = {};
    const otherVideos = [];

    for (const video of allVideos) {
      if (video.playlist) {
        const playlistId = video.playlist._id.toString();
        if (!playlistMap[playlistId]) {
          playlistMap[playlistId] = {
            _id: playlistId,
            title: video.playlist.title,
            thumbnail: video.playlist.thumbnail || "",
            videos: [],
          };
        }
        playlistMap[playlistId].videos.push(video);
      } else {
        otherVideos.push(video);
      }
    }

    const groupedPlaylists = Object.values(playlistMap);
    const totalVideos = allVideos.length;
    const totalPlaylists = groupedPlaylists.length;
    const paginatedVideos = allVideos.slice(skip, skip + limit);

    const hasMore = skip + limit < allVideos.length;

    return res.status(200).json({
      success: true,
      groupedPlaylists,
      otherVideos,
      totalVideos,
      totalPlaylists,
      hasMore,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course videos.",
      error: error.message,
    });
  }
};

exports.uploadCourseVideo = async (req, res) => {
  const { courseId, title, description, duration } = req.body;
  const videoFile = req.files?.video?.[0];
  const thumbnailFile = req.files?.thumbnail?.[0];

  if (
    !courseId ||
    !title ||
    !description ||
    !videoFile ||
    !thumbnailFile ||
    !duration
  ) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const tempVideoPath = path.join(
    os.tmpdir(),
    `video_${Date.now()}_${videoFile.originalname}`
  );
  const outputDir = path.join(os.tmpdir(), `hls_output_${Date.now()}`);

  try {
    fs.writeFileSync(tempVideoPath, videoFile.buffer);
    fs.mkdirSync(outputDir, { recursive: true });
    const generatedResolutions = await convertToHLS(tempVideoPath, outputDir);
    const timestamp = Date.now().toString();
    const {
      success,
      url: hlsUrl,
      error: uploadError,
    } = await uploadHLSFolderToBunny(outputDir, courseId, timestamp);
    if (!success) throw new Error(`Bunny Upload Failed: ${uploadError}`);
    const thumbnailUpload = await uploadToCloudinary(
      thumbnailFile.buffer,
      thumbnailFile.originalname,
      "image"
    );
    const newVideo = new Video({
      course: courseId,
      title: title.trim(),
      description: description.trim(),
      HLSLVideoUrl: hlsUrl,
      thumbnail: thumbnailUpload.secure_url,
      resolutions: generatedResolutions,
      duration,
    });

    const savedVideo = await newVideo.save();
    return res.status(201).json({
      message: "Video uploaded and processed successfully.",
      success: true,
      data: savedVideo,
    });
  } catch (err) {
    console.error("❌ Video Upload Error:", err);
    return res.status(500).json({
      message: "Failed to upload video.",
      error: err.message,
    });
  } finally {
    cleanupTempFiles([tempVideoPath, outputDir]);
  }
};

function convertToHLS(inputPath, outputDir) {
  return new Promise(async (resolve, reject) => {
    const resolutions = [
      { name: "144p", width: 256, height: 144, bitrate: "200k" },
      { name: "240p", width: 426, height: 240, bitrate: "400k" },
      { name: "360p", width: 640, height: 360, bitrate: "800k" },
      { name: "480p", width: 854, height: 480, bitrate: "1400k" },
      { name: "720p", width: 1280, height: 720, bitrate: "2800k" },
      { name: "1080p", width: 1920, height: 1080, bitrate: "5000k" },
      { name: "2k", width: 2560, height: 1440, bitrate: "8000k" },
    ];

    try {
      for (const res of resolutions) {
        await new Promise((resResolve, resReject) => {
          ffmpeg(inputPath)
            .videoCodec("libx264")
            .audioCodec("aac")
            .size(`${res.width}x${res.height}`)
            .videoBitrate(res.bitrate)
            .outputOptions([
              "-preset veryfast",
              "-g 48",
              "-sc_threshold 0",
              "-f hls",
              "-hls_time 10",
              "-hls_playlist_type vod",
              `-hls_segment_filename ${path.join(outputDir, `${res.name}_%03d.ts`)}`,
            ])
            .output(path.join(outputDir, `${res.name}.m3u8`))
            .on("end", () => {
              resResolve();
            })
            .on("error", (err) => {
              console.error(`❌ Error in ${res.name}:`, err);
              resReject(err);
            })
            .run();
        });
      }

      let masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3\n";
      for (const res of resolutions) {
        masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${parseBitrate(res.bitrate)},RESOLUTION=${res.width}x${res.height}\n`;
        masterPlaylist += `${res.name}.m3u8\n`;
      }

      fs.writeFileSync(path.join(outputDir, "master.m3u8"), masterPlaylist);

      resolve(resolutions.map((r) => r.name));
    } catch (err) {
      reject(err);
    }
  });
}

function parseBitrate(bitrateStr) {
  return parseInt(bitrateStr.replace("k", "")) * 1000;
}

function cleanupTempFiles(paths = []) {
  for (const filePath of paths) {
    try {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) fs.rmSync(filePath, { force: true });
        if (stat.isDirectory())
          fs.rmSync(filePath, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`⚠️ Failed to clean up ${filePath}:`, err.message);
    }
  }
}
function convertTimeToSeconds(timeStr) {
  const parts = timeStr.split(":").map(Number).reverse();
  let seconds = 0;
  if (parts[0]) seconds += parts[0];
  if (parts[1]) seconds += parts[1] * 60;
  if (parts[2]) seconds += parts[2] * 3600;
  return seconds;
}
function extractBunnyFolderPath(hlsUrl) {
  try {
    const url = new URL(hlsUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    segments.pop();
    return segments.join("/");
  } catch (err) {
    console.error("Invalid HLS URL format:", hlsUrl);
    return "";
  }
}

exports.getCoursePlaylistsWithVideos = async (req, res) => {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res
        .status(400)
        .json({ success: false, message: "courseId is required." });
    }

    const playlistsWithVideos = await Playlist.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "playlist",
          as: "videos",
        },
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
    ]);

    if (!playlistsWithVideos || playlistsWithVideos.length === 0) {
      return res.status(201).json({
        success: true,
        message: "No playlists found for this course.",
      });
    }

    return res.status(200).json({
      success: true,
      data: playlistsWithVideos,
    });
  } catch (error) {
    console.error("Error fetching playlists and videos:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching playlists and videos.",
      error: error.message,
    });
  }
};

exports.addplaylist = async (req, res) => {
  try {
    const { title, description, course } = req.body;

    if (!course || !title || !req.file) {
      return res.status(400).json({
        success: false,
        message: "courseId, title, and thumbnail are required.",
      });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG, or WEBP images are allowed.",
      });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image should be less than 5MB.",
      });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      "image"
    );
    const thumbnailUrl = result.secure_url;

    const newPlaylist = new Playlist({
      course,
      title: title.trim(),
      description: description?.trim() || "",
      thumbnail: thumbnailUrl,
    });

    const savedPlaylist = await newPlaylist.save();

    return res.status(201).json({
      success: true,
      message: "Playlist created successfully.",
      data: savedPlaylist,
    });
  } catch (error) {
    console.error("Error creating playlist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create playlist.",
      error: error.message,
    });
  }
};

exports.uploadPlaylistVideo = async (req, res) => {
  const { title, description, duration, size, plaList_id, courseId } = req.body;
  console.log("Request body:", req.body);
  const videoFile = req.files?.video?.[0];
  const thumbnailFile = req.files?.thumbnail?.[0];

  if (
    !title ||
    !description ||
    !videoFile ||
    !duration ||
    !size ||
    !plaList_id ||
    !courseId ||
    !thumbnailFile
  ) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (
    !title ||
    !description ||
    !videoFile ||
    !duration ||
    !size ||
    !plaList_id ||
    !courseId
  ) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const tempVideoPath = path.join(
    os.tmpdir(),
    `video_${Date.now()}_${videoFile.originalname}`
  );
  const outputDir = path.join(os.tmpdir(), `hls_output_${Date.now()}`);

  try {
    fs.writeFileSync(tempVideoPath, videoFile.buffer);
    fs.mkdirSync(outputDir, { recursive: true });

    const generatedResolutions = await convertToHLS(tempVideoPath, outputDir);

    const timestamp = Date.now().toString();
    const {
      success,
      url: hlsUrl,
      error: uploadError,
    } = await uploadHLSFolderToBunny(outputDir, plaList_id, timestamp);
    if (!success) throw new Error(`Bunny Upload Failed: ${uploadError}`);
    const durationInSeconds = convertTimeToSeconds(duration);

    const thumbnailUpload = await uploadToCloudinary(
      thumbnailFile.buffer,
      thumbnailFile.originalname,
      "image"
    );

    const newVideo = new Video({
      title: title.trim(),
      description: description.trim(),
      duration: durationInSeconds,
      size,
      course: courseId,
      playlist: plaList_id,
      HLSLVideoUrl: hlsUrl,
      resolutions: generatedResolutions,
      thumbnail: thumbnailUpload.secure_url,
    });

    const savedVideo = await newVideo.save();

    res.status(201).json({
      message: "Video uploaded successfully to playlist.",
      success: true,
      data: savedVideo,
    });
  } catch (err) {
    console.error("❌ Playlist Upload Error:", err);
    return res
      .status(500)
      .json({ message: "Upload failed.", error: err.message });
  } finally {
    cleanupTempFiles([tempVideoPath, outputDir]);
  }
};
exports.updateStatusOfPlaylist = async (req, res) => {
  try {
    const { playlist_id } = req.query;
    const { status } = req.body;

    if (!playlist_id || !status) {
      return res
        .status(400)
        .json({ message: "playlist_id and status are required." });
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlist_id,
      { status },
      { new: true }
    );
    if (!updatedPlaylist) {
      return res.status(404).json({ message: "Playlist not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Playlist status updated successfully.",
      data: updatedPlaylist,
    });
  } catch (error) {
    console.error("❌ updateStatusOfPlaylist error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
exports.deletePlaylist = async (req, res) => {
  try {
    const playList_id = req.params.playList_id;

    if (!playList_id) {
      return res.status(400).json({ message: "Playlist ID is required." });
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playList_id);
    if (!deletedPlaylist) {
      return res.status(404).json({ message: "Playlist not found." });
    }

    const videos = await Video.find({ playlist: playList_id });

    for (const video of videos) {
      if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail, "image");
      }

      if (video.HLSLVideoUrl) {
        const hlsFolderPath = extractBunnyFolderPath(video.HLSLVideoUrl);

        const client = new ftp.Client();
        client.ftp.verbose = false;

        try {
          await client.access({
            host: process.env.BUNNY_STORAGE_HOST,
            user: process.env.BUNNY_STORAGE_USERNAME,
            password: process.env.BUNNY_STORAGE_PASSWORD,
            secure: false,
          });

          await client.removeDir(hlsFolderPath);
        } catch (ftpErr) {
          console.error("❌ BunnyCDN deletion error:", ftpErr.message);
        } finally {
          client.close();
        }
      }
    }

    const deletedVideoDocs = await Video.deleteMany({ playlist: playList_id });

    return res.status(200).json({
      success: true,
      message: "Playlist and associated videos/assets deleted successfully.",
    });
  } catch (error) {
    console.error("❌ deletePlaylist error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.updatePlaylist = async (req, res) => {
  try {
    const { title, description, playlistId } = req.body;

    if (!playlistId || !title) {
      return res.status(400).json({
        success: false,
        message: "playlistId and title are required.",
      });
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found.",
      });
    }

    let thumbnailUrl = playlist.thumbnail;
    if (req.file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, PNG, or WEBP images are allowed.",
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Image should be less than 5MB.",
        });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        "image"
      );
      thumbnailUrl = result.secure_url;
    }

    playlist.title = title.trim();
    playlist.description = description?.trim() || "";
    playlist.thumbnail = thumbnailUrl;

    const updatedPlaylist = await playlist.save();

    return res.status(200).json({
      success: true,
      message: "Playlist updated successfully.",
      data: updatedPlaylist,
    });
  } catch (error) {
    console.error("Error updating playlist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update playlist.",
      error: error.message,
    });
  }
};

exports.deleteCourse = async (req, res) => {
  const courseId = req.params.courseId;

  if (!courseId) {
    return res.status(400).json({ message: "Course ID is required." });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }
    const deletedPlaylists = await Playlist.deleteMany({ course: courseId });

    const videos = await Video.find({ course: courseId });

    for (const video of videos) {
      if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail, "image");
      }

      if (video.HLSLVideoUrl) {
        const hlsFolderPath = extractBunnyFolderPath(video.HLSLVideoUrl);

        const client = new ftp.Client();
        client.ftp.verbose = false;

        try {
          await client.access({
            host: process.env.BUNNY_STORAGE_HOST,
            user: process.env.BUNNY_STORAGE_USERNAME,
            password: process.env.BUNNY_STORAGE_PASSWORD,
            secure: false,
          });
          await client.removeDir(hlsFolderPath);
        } catch (ftpErr) {
        } finally {
          client.close();
        }
      }
    }

    const deletedVideos = await Video.deleteMany({ course: courseId });
    if (course.image) {
      await deleteFromCloudinary(course.image, "image");
    }
    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      success: true,
      message: "Course and all related data deleted successfully.",
    });
  } catch (error) {
    console.error("❌ deleteCourse error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};
exports.updateCourseStatus = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { status } = req.body;

    console.log("Updating course status:", { courseId, status });

    if (!courseId || typeof status !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Valid courseId and boolean status (true/false) are required.",
      });
    }
    const newStatus = status ? "Published" : "Draft";

    console.log("Final status to update:", newStatus);

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { status: newStatus },
      { new: true }
    );

    console.log("Updated course:", updatedCourse);

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course status updated successfully.",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update course status.",
      error: error.message,
    });
  }
};

exports.getPurchasedCoursesByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const purchasedCourses = await PurchasedCourse.find({ student: studentId })
      .populate("course")
      .sort({ createdAt: -1 });

    if (!purchasedCourses || purchasedCourses.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No courses purchased by this student",
      });
    }

    return res.status(200).json({
      success: true,
      data: purchasedCourses,
    });
  } catch (error) {
    console.error("Error fetching purchased courses:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.markVideoAsWatched = async (req, res) => {
  const { studentId, courseId, videoId } = req.body;

  try {
    const video = await Video.findById(videoId);
    if (!video || video.course.toString() !== courseId) {
      return res.status(400).json({ message: "Invalid video or course" });
    }

    const allCourseVideos = await Video.find({
      course: courseId,
      isPublished: true,
    }).select("_id");
    const totalVideoCount = allCourseVideos.length;

    const progress = await CourseProgress.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $addToSet: { completedVideos: videoId } },
      { upsert: true, new: true }
    );

    const completedCount = progress.completedVideos.length;

    if (completedCount >= totalVideoCount && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.certificateGenerated = true;
      await progress.save();
    }

    res.status(200).json({
      message: "Progress updated",
      completedCount,
      totalVideoCount,
      courseCompleted: progress.isCompleted,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStudentCoursesSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log("hii the student id is :", studentId);

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }
    const purchases = await PurchasedCourse.find({
      student: studentId,
    }).populate("course");

    const results = [];

    for (const purchase of purchases) {
      const course = purchase.course;
      const videos = await Video.find({ course: course._id });
      const progress = await CourseProgress.findOne({
        student: studentId,
        course: course._id,
      });

      const completedCount = progress?.completedVideos?.length || 0;
      const totalCount = videos.length;

      results.push({
        _id: course._id,
        title: course.title,
        thumbnail: course.image,
        totalVideos: totalCount,
        completedVideos: completedCount,
        isCompleted: progress?.isCompleted || false,
        certificateGenerated: progress?.certificateGenerated || false,
        enrolledDate: progress?.createdAt || purchase.createdAt,
      });
    }

    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("Error in getStudentCoursesSummary:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getCourseProgressDetails = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    if (!studentId || !courseId) {
      return res
        .status(400)
        .json({ message: "Student ID and Course ID are required." });
    }

    const course = await Course.findById(courseId).select("title image");
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const videos = await Video.find({ course: courseId })
      .select("_id title duration")
      .sort({ uploadedAt: 1 });

    const progress = await CourseProgress.findOne({
      student: studentId,
      course: courseId,
    });
    const completedIds =
      progress?.completedVideos?.map((id) => id.toString()) || [];

    const videoList = videos.map((video) => ({
      _id: video._id,
      title: video.title,
      duration: formatDuration(video.duration),
      isCompleted: completedIds.includes(video._id.toString()),
    }));

    const response = {
      _id: course._id,
      title: course.title,
      thumbnail: course.image,
      totalVideos: videos.length,
      completedVideos: completedIds.length,
      isCompleted: progress?.isCompleted || false,
      certificateGenerated: progress?.certificateGenerated || false,
      enrolledDate: progress?.createdAt || null,
      videos: videoList,
    };

    return res.status(200).json({ success: true, data: response });
  } catch (err) {
    console.error("Error fetching course progress:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

function formatDuration(minutes) {
  const totalSeconds = Math.floor(minutes * 60);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
