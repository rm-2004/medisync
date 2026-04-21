const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true },
    times: { type: [String], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    notes: { type: String, default: null },
    color: { type: String, default: "#3b82f6" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medication", medicationSchema);