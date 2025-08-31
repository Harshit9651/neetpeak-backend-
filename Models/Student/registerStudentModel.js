const mongoose = require('mongoose');
const  bcrypt = require('bcryptjs');
const { boolean } = require('joi');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

  email:{
    type:String
  },
    mobile: {
      type: String,
      match: [/^\d{10}$/, 'Mobile number must be 10 digits'],
      // unique: true,
    },
 

    password: {
      type: String,
      minlength: 6,
      select: false, 
    },
 otp: {
  type: String,
},
otpExpires: {
  type: Date,
},
studentType: {
  type: String,
  enum: ["paid", "unpaid"],
  default: "unpaid"
},
     profilePicture: {
    type: String,
    default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQttE9sxpEu1EoZgU2lUF_HtygNLCaz2rZYHg&s",
  },
  },
  {
    timestamps: true,
  }
);


studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});


studentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};



const RegisterStudent = mongoose.models.RegisterStudent || mongoose.model('RegisterStudent', studentSchema);


module.exports = RegisterStudent

