const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    uniqueId: { type: String, default: () => uuidv4(), unique: true, index: true },
    name: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  }
);

module.exports = mongoose.model("User", userSchema);