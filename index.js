const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cors = require("cors");

const Task = require("./modules/TaskSchema");
const Data = require("./modules/TaskData");

const app = express();
const PORT = 3011;
const JWT_SECRET = process.env.JWT_SECRET || "kaifskey";

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://root:root@cluster0.xsw16w4.mongodb.net/Task?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized: No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// Routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const exist = await Task.findOne({ email });
    if (exist) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const task = new Task({ username, email, password: hashedPassword });
    await task.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Task.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false, // true if using HTTPS
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: "Login error: " + err.message });
  }
});

// Add Task
app.post("/AddData", authMiddleware, async (req, res) => {
  try {
    const { title, time, discription, status } = req.body;

    const savedData = await Data.create({
      title,
      time,
      discription,
      status,
      userId: req.user.id, // ✅ store user ID
    });

    res.status(201).json({ message: "Task added", data: savedData });
  } catch (error) {
    res.status(500).json({ message: "Task not added", error: error.message });
  }
});

// Get Profile
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await Task.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Tasks (for logged in user only)
app.get("/taskData", authMiddleware, async (req, res) => {
  try {
    const data = await Data.find({ userId: req.user.id });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
});

// Get Single Task (only if owned by user)
app.get("/taskData/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Data.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(403).json({ error: "Unauthorized access" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Task (only if owned by user)
app.patch("/update/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Data.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );

    if (!task) return res.status(403).json({ error: "Unauthorized update attempt" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Task (only if owned by user)
app.delete("/dataDelete/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Data.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) return res.status(403).json({ error: "Unauthorized delete attempt" });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
});

// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
