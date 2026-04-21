const User = require("../models/User");

async function requireUser(req, res, next) {
  const userId = req.headers["x-user-id"];
  if (!userId) return res.status(401).json({ error: "Missing X-User-Id header" });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "Invalid user ID" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid user ID format" });
  }
}

module.exports = { requireUser };