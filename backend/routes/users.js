const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/create", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
    const user = new User({ name: name.trim() });
    await user.save();
    res.status(201).json({ _id: user._id, name: user.name, uniqueId: user.uniqueId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { uniqueId } = req.body;
    if (!uniqueId) return res.status(400).json({ error: "Unique ID is required" });
    const user = await User.findOne({ uniqueId: uniqueId.trim() });
    if (!user) return res.status(404).json({ error: "No account found with that ID" });
    res.json({ _id: user._id, name: user.name, uniqueId: user.uniqueId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/lookup/:uniqueId", async (req, res) => {
  try {
    const user = await User.findOne({ uniqueId: req.params.uniqueId });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ _id: user._id, name: user.name, uniqueId: user.uniqueId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;