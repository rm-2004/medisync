const mongoose = require("mongoose");

const caretakerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    caretakerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true },
    relationship: { type: String, required: true },
    canViewMedications: { type: Boolean, default: true },
    canViewSymptoms: { type: Boolean, default: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Caretaker", caretakerSchema);