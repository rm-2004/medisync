const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const { requireUser } = require("../middleware/auth");
const Medication = require("../models/Medication");
const SymptomLog = require("../models/SymptomLog");
const MedicationLog = require("../models/MedicationLog");

router.use(requireUser);

async function groqChat(messages) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.5,
    max_tokens: 700,
  });
  return completion.choices[0].message.content.trim();
}

router.post("/generate", async (req, res) => {
  try {
    const { startDate, endDate, includeSymptoms, includeMedications, includeAdherence } = req.body;
    const uid = req.user._id;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const medications = includeMedications ? await Medication.find({ userId: uid }) : [];
    const symptoms = includeSymptoms
      ? await SymptomLog.find({ userId: uid, loggedAt: { $gte: start, $lte: end } }).sort({ loggedAt: -1 })
      : [];

    let adherenceRate = 0;
    if (includeAdherence) {
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      let totalDoses = 0; let takenDoses = 0;
      const activeMeds = medications.filter((m) => m.isActive);
      for (let i = 0; i <= days; i++) {
        const d = new Date(start); d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        for (const med of activeMeds) totalDoses += med.times.length;
        takenDoses += await MedicationLog.countDocuments({ userId: uid, date: dateStr });
      }
      adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
    }

    let aiSummary = null;
    if (process.env.GROQ_API_KEY) {
      try {
        // Build detailed context
        const symSummary = symptoms.length === 0
          ? "No symptoms were logged during this period."
          : symptoms.slice(0, 10).map((s) => `${s.symptom} (severity ${s.severity}/10 — ${s.severity <= 4 ? "mild" : s.severity <= 6 ? "moderate" : "severe"}, on ${new Date(s.loggedAt).toLocaleDateString()})`).join("; ");

        const medSummary = medications.length === 0
          ? "No medications on record."
          : medications.map((m) => `${m.name} ${m.dosage} ${m.frequency} (${m.isActive ? "currently active" : "inactive"})`).join("; ");

        const highSeveritySymptoms = symptoms.filter((s) => s.severity >= 7);

        aiSummary = await groqChat([
          {
            role: "system",
            content: `You are a compassionate and experienced general practitioner writing a clear, plain-English health summary for a patient. Your summary should:
1. Give a brief overview of the patient's health during the period in 2-3 sentences.
2. Comment on their medication adherence if data is available — explain what the percentage means in plain terms.
3. Mention any concerning symptom patterns (frequency, severity) and what they might indicate in general terms — use phrases like "this may suggest", "worth discussing with your doctor".
4. Suggest 2-3 actionable health tips relevant to the patient's data.
5. If any symptoms scored 7 or above, ALWAYS include a recommendation to consult a doctor in person.
6. End with an encouraging note.
Keep the total summary under 250 words, use simple everyday language (suitable for elderly patients too), no bullet points — flowing paragraphs only. Never diagnose definitively.`,
          },
          {
            role: "user",
            content: `Please write a health summary for the period ${startDate} to ${endDate}.

Medications: ${medSummary}
Medication adherence rate: ${includeAdherence ? `${adherenceRate}%` : "Not measured"}
Symptoms during this period: ${symSummary}
Total symptoms logged: ${symptoms.length}
High-severity symptoms (7+/10): ${highSeveritySymptoms.length > 0 ? highSeveritySymptoms.map((s) => `${s.symptom} (${s.severity}/10)`).join(", ") : "None"}`,
          },
        ]);
      } catch (e) {
        console.error("Groq error:", e.message);
        aiSummary = null;
      }
    }

    res.json({
      id: Date.now().toString(),
      startDate,
      endDate,
      medications,
      symptoms,
      adherenceRate,
      aiSummary,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/ai-summary", async (req, res) => {
  try {
    const days = req.body.days || 7;
    const uid = req.user._id;
    const since = new Date(); since.setDate(since.getDate() - days);
    const symptoms = await SymptomLog.find({ userId: uid, loggedAt: { $gte: since } });
    const medications = await Medication.find({ userId: uid, isActive: true });
    const today = new Date().toISOString().split("T")[0];
    const takenToday = await MedicationLog.countDocuments({ userId: uid, date: today });

    if (!process.env.GROQ_API_KEY) {
      return res.json({
        summary: "AI summary not configured. Add GROQ_API_KEY to backend .env to enable.",
        keyInsights: ["No Groq API key found"],
        recommendations: ["Get a free key at console.groq.com"],
      });
    }

    const text = await groqChat([
      {
        role: "system",
        content: "You are a helpful health assistant. Respond ONLY with a valid raw JSON object — no markdown, no code fences. Keys: summary (string, 2-3 sentences), keyInsights (array of 3 short strings), recommendations (array of 3 actionable strings). No medical diagnoses. Use plain, simple language.",
      },
      {
        role: "user",
        content: `Analyze last ${days} days health data and return JSON.
Active medications: ${medications.map((m) => m.name).join(", ") || "None"}
Symptoms logged: ${symptoms.length}
Recent symptoms: ${symptoms.slice(0, 5).map((s) => `${s.symptom} (${s.severity}/10)`).join(", ") || "None"}
Doses taken today: ${takenToday}`,
      },
    ]);

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
