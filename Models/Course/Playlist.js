const mongoose = require("mongoose");
const playlistSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
   thumbnail: {
    type: String,
    required: true,
   },
  description: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status:{
    type: String,
    enum: ['public', 'draft'],
    default: 'draft',
  }
});

module.exports = mongoose.model('Playlist', playlistSchema);
