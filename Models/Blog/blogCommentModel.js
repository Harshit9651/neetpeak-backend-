const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog",
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },


  isFlagged: {
    type: Boolean,
    default: false,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  ratting:{
    type:Number,
    require:true
  }
}, {
  timestamps: true, 
});

module.exports = mongoose.model("Comment", CommentSchema);
