const mongoose = require("mongoose");

const medicationLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    medicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Medication", required: true },
    scheduledTime: { type: String, required: true },
    takenAt: { type: Date, default: Date.now },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicationLog", medicationLogSchema);
