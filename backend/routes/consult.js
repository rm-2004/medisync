const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const mongoose = require("mongoose");
const { requireUser } = require("../middleware/auth");
const Medication = require("../models/Medication");
const SymptomLog = require("../models/SymptomLog");
const MedicationLog = require("../models/MedicationLog");

router.use(requireUser);

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  messages: [{ role: String, content: String }],
  updatedAt: { type: Date, default: Date.now },
});
const ChatHistory = mongoose.models.ChatHistory || mongoose.model("ChatHistory", chatHistorySchema);

const SYSTEM_PROMPT = `You are MediSync Health Assistant, a knowledgeable and compassionate virtual health consultant.

Your role is to:
1. Listen carefully to symptoms described by the patient
2. Ask follow-up questions one at a time to better understand duration, severity, and relevant history
3. Provide clear, accurate, empathetic responses like a caring general practitioner would
4. Suggest basic over-the-counter remedies or lifestyle measures when appropriate
5. ALWAYS recommend visiting a real doctor when symptoms are severe (7 or more out of 10), persistent, or involve chest pain, breathing difficulty, sudden weakness, or severe headache
6. NEVER diagnose definitively. Use phrases like "this could suggest", "you may be experiencing", "worth checking with your doctor"
7. Use the PATIENT CONTEXT below to personalise your advice. Reference their actual medications and recent symptoms when relevant.
8. Be warm and use simple language suitable for elderly patients.

CRITICAL FORMATTING RULES — you must follow these exactly:
- Write in plain flowing paragraphs only. No markdown whatsoever.
- Never use asterisks (*) for any reason — not for bold, not for emphasis, not for lists.
- Never use hash symbols (#) for headings.
- Never use hyphens (-) or numbers at the start of lines as bullet points.
- Never use underscores (_) for formatting.
- If you want to list items, write them as a natural sentence: "You should consider x, y, and z."
- Line breaks between paragraphs are fine.

IMPORTANT: Always end consultations about concerning symptoms with a recommendation to visit a healthcare provider. AI cannot replace professional medical examination.`;

router.post("/chat", async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: "AI consultant is not configured. Please add GROQ_API_KEY to the backend .env file.",
      });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const sanitised = messages
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.trim() }));

    if (sanitised.length === 0) {
      return res.status(400).json({ error: "No valid messages provided" });
    }

    const uid = req.user._id;
    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [activeMeds, recentSymptoms, dosesToday] = await Promise.all([
      Medication.find({ userId: uid, isActive: true }).lean(),
      SymptomLog.find({ userId: uid, loggedAt: { $gte: sevenDaysAgo } })
        .sort({ loggedAt: -1 })
        .limit(10)
        .lean(),
      MedicationLog.countDocuments({ userId: uid, date: today }),
    ]);

    const medLines =
      activeMeds.length > 0
        ? activeMeds
            .map(
              (m) =>
                `${m.name} ${m.dosage} — ${m.frequency} (times: ${m.times.join(", ")})${m.notes ? ` [note: ${m.notes}]` : ""}`
            )
            .join("\n")
        : "None recorded";

    const symptomLines =
      recentSymptoms.length > 0
        ? recentSymptoms
            .map(
              (s) =>
                `${s.symptom} — severity ${s.severity}/10 on ${new Date(s.loggedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}${s.notes ? ` (${s.notes})` : ""}`
            )
            .join("\n")
        : "None logged in last 7 days";

    const contextBlock = `
PATIENT CONTEXT (live data from their MediSync records — use this to personalise your responses):
Active medications:
${medLines}

Symptoms logged in the last 7 days:
${symptomLines}

Doses taken today: ${dosesToday}
Today's date: ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + "\n\n" + contextBlock },
        ...sanitised,
      ],
      temperature: 0.6,
      max_tokens: 600,
    });

    let reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({ error: "Empty response from AI provider" });
    }

    reply = reply
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[-•]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/__/g, "")
      .trim();

    await ChatHistory.findOneAndUpdate(
      { userId: uid },
      { messages: sanitised.concat([{ role: "assistant", content: reply }]), updatedAt: new Date() },
      { upsert: true }
    );

    res.json({ reply });
  } catch (err) {
    console.error("Consult chat error:", err.message);

    if (err.status === 401) {
      return res.status(502).json({ error: "Invalid GROQ_API_KEY. Please check your backend configuration." });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "AI service rate limit reached. Please wait a moment and try again." });
    }

    res.status(500).json({ error: "Failed to get AI response. Please try again." });
  }
});

router.get("/history", async (req, res) => {
  try {
    const record = await ChatHistory.findOne({ userId: req.user._id }).lean();
    res.json({ messages: record?.messages || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/history", async (req, res) => {
  try {
    await ChatHistory.findOneAndDelete({ userId: req.user._id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;