const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/users");
const medicationRoutes = require("./routes/medications");
const symptomRoutes = require("./routes/symptoms");
const reminderRoutes = require("./routes/reminders");
const caretakerRoutes = require("./routes/caretakers");
const reportRoutes = require("./routes/reports");
const dashboardRoutes = require("./routes/dashboard");
const consultRoutes = require("./routes/consult");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/symptoms", symptomRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/caretakers", caretakerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/consult", consultRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => { console.error("MongoDB error:", err.message); process.exit(1); });