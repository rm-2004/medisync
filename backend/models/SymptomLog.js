const mongoose = require("mongoose");

const symptomLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symptom: { type: String, required: true, trim: true },
    severity: { type: Number, required: true, min: 1, max: 10 },
    notes: { type: String, default: null },
    tags: { type: [String], default: [] },
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SymptomLog", symptomLogSchema);

