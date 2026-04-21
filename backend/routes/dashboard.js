const express = require("express");
const router = express.Router();
const { requireUser } = require("../middleware/auth");
const Medication = require("../models/Medication");
const MedicationLog = require("../models/MedicationLog");
const SymptomLog = require("../models/SymptomLog");
const Reminder = require("../models/Reminder");

router.use(requireUser);

router.get("/summary", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const uid = req.user._id;

    const allMeds = await Medication.find({ userId: uid });
    const activeMeds = allMeds.filter((m) => m.isActive);
    let totalDosesToday = 0;
    for (const med of activeMeds) totalDosesToday += med.times.length;

    const dosesTakenToday = await MedicationLog.countDocuments({ userId: uid, date: today });
    const adherenceRate = totalDosesToday > 0 ? Math.round((dosesTakenToday / totalDosesToday) * 100) : 0;
    const symptomsLastWeek = await SymptomLog.countDocuments({ userId: uid, loggedAt: { $gte: weekAgo } });
    const recentSymptoms = await SymptomLog.find({ userId: uid, loggedAt: { $gte: weekAgo } });
    const avgSymptomSeverity = recentSymptoms.length > 0
      ? parseFloat((recentSymptoms.reduce((s, x) => s + x.severity, 0) / recentSymptoms.length).toFixed(1))
      : null;
    const activeReminders = await Reminder.countDocuments({ userId: uid, isEnabled: true });

    res.json({ totalMedications: allMeds.length, activeMedications: activeMeds.length, totalDosesToday, dosesTakenToday, adherenceRate, symptomsLastWeek, avgSymptomSeverity, activeReminders });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;