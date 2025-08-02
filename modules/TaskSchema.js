const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // 🚨 Ensures email is unique
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Task', TaskSchema);
