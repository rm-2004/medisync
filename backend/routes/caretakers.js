const express = require("express");
const router = express.Router();
const { requireUser } = require("../middleware/auth");
const Caretaker = require("../models/Caretaker");
const User = require("../models/User");
const Medication = require("../models/Medication");
const SymptomLog = require("../models/SymptomLog");

router.use(requireUser);

router.get("/", async (req, res) => {
  try {
    const caretakers = await Caretaker.find({ userId: req.user._id }).sort({ addedAt: -1 });
    res.json(caretakers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, relationship, canViewMedications, canViewSymptoms, uniqueId } = req.body;
    let caretakerUserId = null;

    if (uniqueId) {
      const linkedUser = await User.findOne({ uniqueId: uniqueId.trim() });
      if (!linkedUser) return res.status(404).json({ error: "No user found with that Unique ID" });
      if (linkedUser._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: "You cannot add yourself as a caretaker" });
      }
      caretakerUserId = linkedUser._id;
    }

    const caretaker = new Caretaker({
      userId: req.user._id,
      caretakerUserId,
      name: name || (caretakerUserId ? "Linked User" : ""),
      email: email || null,
      relationship,
      canViewMedications: canViewMedications !== false,
      canViewSymptoms: canViewSymptoms !== false,
    });
    await caretaker.save();
    res.status(201).json(caretaker);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Caretaker.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/member-data/:caretakerId", async (req, res) => {
  try {
    const caretaker = await Caretaker.findOne({ _id: req.params.caretakerId, userId: req.user._id });
    if (!caretaker || !caretaker.caretakerUserId) {
      return res.status(404).json({ error: "Linked member not found" });
    }
    const memberId = caretaker.caretakerUserId;
    const member = await User.findById(memberId);
    const result = { name: member?.name || "Unknown" };

    if (caretaker.canViewMedications) {
      result.medications = await Medication.find({ userId: memberId, isActive: true });
    }
    if (caretaker.canViewSymptoms) {
      const since = new Date(); since.setDate(since.getDate() - 30);
      result.symptoms = await SymptomLog.find({ userId: memberId, loggedAt: { $gte: since } }).sort({ loggedAt: -1 }).limit(20);
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;