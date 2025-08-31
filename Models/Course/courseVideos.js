const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({

    course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  playlist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist',
    required: false 
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  HLSLVideoUrl: {
    type: String,
    required: true, 
  },
  resolutions: {
    type: [String], 
    default: ['360p'],
  },
  thumbnail: {
    type: String,
    default: "",
  },
  duration: {
    type: Number, 
    default: 0,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  isPublished: {
    type: Boolean,
    default: false,
  }
});

videoSchema.index({ playlist: 1, order: 1 }); 

module.exports = mongoose.model('Video', videoSchema);
