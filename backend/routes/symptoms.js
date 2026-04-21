const express = require("express");
const router = express.Router();
const { requireUser } = require("../middleware/auth");
const SymptomLog = require("../models/SymptomLog");

router.use(requireUser);

router.get("/", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const symptoms = await SymptomLog.find({ userId: req.user._id, loggedAt: { $gte: since } }).sort({ loggedAt: -1 });
    res.json(symptoms);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/", async (req, res) => {
  try {
    const log = new SymptomLog({ ...req.body, userId: req.user._id });
    await log.save();
    res.status(201).json(log);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await SymptomLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/trends", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));
      const symptoms = await SymptomLog.find({ userId: req.user._id, loggedAt: { $gte: start, $lte: end } });
      const avgSeverity = symptoms.length > 0
        ? parseFloat((symptoms.reduce((s, x) => s + x.severity, 0) / symptoms.length).toFixed(1))
        : 0;
      result.push({ date: start.toISOString().split("T")[0], avgSeverity, count: symptoms.length });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
