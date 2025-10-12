const Admin = require("../../Models/Admin/adminModel");
const generateToken = require("../../Utiles/generateToken");
const Contact = require("../../Models/Admin/userQuaryModel")


exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("hii")

    const adminUser = await Admin.findOne({ username });
    console.log(adminUser)

    if (!adminUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await adminUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.status(200).json({
      message: "Login successful",
      token: generateToken(adminUser),
      user: {
        id: adminUser._id,
        email: adminUser.email || null,
        role: adminUser.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};





const seedSuperAdmin = async () => {
  try {
    const deleteadmin = await Admin.deleteOne({});
    console.log(deleteadmin)
    const existing = await Admin.findOne({ username: "neetpeak" });
    if (existing) {
      console.log("Superadmin already exists");
      return;
    }

    const hashedPassword = "neetpeak@123";

    const newAdmin = new Admin({
      username: "neetpeak",
      password: hashedPassword,
      role: "superadmin",
    });

    await newAdmin.save();
    console.log("✅ Superadmin created successfully");
  } catch (error) {
    console.error("❌ Failed to seed superadmin:", error);
  }
};

exports.Usersignup = async (req, res) => {
  try {
    const { username, password, role, phone } = req.body;

    if (!username || !password || !role || !phone) {
      return res.status(400).json({
        error: "All fields are required: email, password, role, and phone.",
      });
    }

    const existing = await Admin.findOne({ username });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Admin already exists with this email." });
    }

    const newAdmin = new Admin({ username, password, role, phone });
    await newAdmin.save();

    return res.status(200).json({
      message: "Admin registered successfully",
      token: generateToken(newAdmin),
      success:true
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await Admin.find(
      { role: { $ne: "superadmin" } },
      { password: 0, __v: 0 }
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await Admin.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    await Admin.findByIdAndDelete(userId);


    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    console.log("update");

    const { username, phone, role, password, userId } = req.body;
    const updateData = {
      username,
      phone,
      role,
    };

    if (password) {
      updateData.password = password;
    }

    const updatedUser = await Admin.findOneAndUpdate(
      { _id: userId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const { password: _, ...userWithoutPassword } = updatedUser.toObject();
    console.log(updatedUser);

    return res.status(200).json({
      success: true,
      message: "User updated",
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.sendUserQuaryToAdmin = async(req,res)=>{
 try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    
    const newContact = new Contact({ name, email, subject, message });
   const saveUserQuary =  await newContact.save();
   console.log(saveUserQuary)

    return res.status(201).json({ success: true, message: "Your message has been submitted successfully." });
  } catch (error) {
    console.error("Contact form error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
  }
}
exports.getAllUserQuaries = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }); 

    if (contacts.length === 0) {
      return res.status(404).json({ success: false, message: "No contacts found." });
    }

    return res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error.message);
    return res.status(500).json({ success: false, message: "Server error while fetching contacts." });
  }
};

