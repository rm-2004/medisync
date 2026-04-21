const express = require("express");
const router = express.Router();
const { requireUser } = require("../middleware/auth");
const Reminder = require("../models/Reminder");
const Medication = require("../models/Medication");

router.use(requireUser);

router.get("/", async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(reminders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { medicationId, time, days } = req.body;
    const med = await Medication.findOne({ _id: medicationId, userId: req.user._id });
    if (!med) return res.status(404).json({ error: "Medication not found" });
    const reminder = new Reminder({ userId: req.user._id, medicationId, medicationName: med.name, time, days });
    await reminder.save();
    res.status(201).json(reminder);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!reminder) return res.status(404).json({ error: "Not found" });
    res.json(reminder);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
