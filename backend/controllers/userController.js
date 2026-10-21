const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Leave = require("../models/LeaveRequest");

//get employees
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const leaves = await Leave.find({ employee: u._id });

        const pending = leaves.filter((l) => l.status === "pending").length;
        const approved = leaves.filter((l) => l.status === "approved").length;
        const rejected = leaves.filter((l) => l.status === "rejected").length;

        return {
          ...u._doc,
          totalLeaves: leaves.length,
          pending,
          approved,
          rejected,
        };
      }),
    );

    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

//create employees
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role = "employee" } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!["employee", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be employee or admin" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.trim(),
      password: hashed,
      role,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(500).json({ message: error.message });
  }
};

//update employee

exports.updateUser = async (req, res) => {
  const { name, email, role } = req.body;

  if (role && !["employee", "admin"].includes(role)) {
    return res.status(400).json({ message: "Role must be employee or admin" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, ...(role ? { role } : {}) },
    { new: true, runValidators: true },
  ).select("-password");

  res.json(user);
};

//delete employee

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};
