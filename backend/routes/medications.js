const express = require("express");
const router = express.Router();
const { requireUser } = require("../middleware/auth");
const Medication = require("../models/Medication");
const MedicationLog = require("../models/MedicationLog");

router.use(requireUser);

router.get("/", async (req, res) => {
  try {
    const meds = await Medication.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(meds);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const med = new Medication({ ...req.body, userId: req.user._id });
    await med.save();
    res.status(201).json(med);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/:id", async (req, res) => {
  try {
    const med = await Medication.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!med) return res.status(404).json({ error: "Not found" });
    res.json(med);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await Medication.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    await MedicationLog.deleteMany({ medicationId: req.params.id, userId: req.user._id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/:id/take", async (req, res) => {
  try {
    const { scheduledTime } = req.body;
    const today = new Date().toISOString().split("T")[0];
    const log = new MedicationLog({
      userId: req.user._id,
      medicationId: req.params.id,
      scheduledTime,
      date: today,
    });
    await log.save();
    res.status(201).json(log);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get("/upcoming", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const medications = await Medication.find({ userId: req.user._id, isActive: true });
    const logs = await MedicationLog.find({ userId: req.user._id, date: today });
    const doses = [];
    for (const med of medications) {
      for (const time of med.times) {
        const isTaken = logs.some(
          (l) => l.medicationId.toString() === med._id.toString() && l.scheduledTime === time
        );
        doses.push({ medicationId: med._id, medicationName: med.name, dosage: med.dosage, scheduledTime: time, color: med.color, isTaken });
      }
    }
    doses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    res.json(doses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/adherence", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const medications = await Medication.find({ userId: req.user._id, isActive: true });
      let totalDoses = 0;
      for (const med of medications) totalDoses += med.times.length;
      const takenCount = await MedicationLog.countDocuments({ userId: req.user._id, date: dateStr });
      const adherenceRate = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 0;
      result.push({ date: dateStr, adherenceRate, taken: takenCount, total: totalDoses });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;