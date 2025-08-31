const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  
  mrp: { type: Number, required: true },
 price: { type: Number }, 

  duration: {
    type: String,
    enum: ['Free', '6 Months', '1 Year', 'Lifetime'],
    default: 'Free',
  },

  courseLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },

  tags: [{ type: String, trim: true }],

  image: { type: String },

  status: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Draft',
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true, 
});

module.exports = mongoose.model('Course', courseSchema);
