const mongoose = require("mongoose");

const TaskData = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  discription: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  // ✅ Added userId to associate task with a specific user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
});

module.exports = mongoose.model("Data", TaskData);
