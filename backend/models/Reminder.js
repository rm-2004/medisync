const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    medicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Medication", required: true },
    medicationName: { type: String, required: true },
    time: { type: String, required: true },
    days: { type: [String], required: true },
    isEnabled: { type: Boolean, default: true },
    lastSent: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reminder", reminderSchema);

