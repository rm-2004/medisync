import { useState, useEffect } from "react";
import { Pill, Activity, Bell, CheckCircle2, Clock, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";
import { api } from "../context/api.js";
import { useToast } from "../App.jsx";

export default function Dashboard() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [doses, setDoses] = useState([]);
  const [adherence, setAdherence] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [s, d, a, t] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/medications/upcoming"),
        api.get("/medications/adherence?days=7"),
        api.get("/symptoms/trends?days=7"),
      ]);
      setSummary(s);
      setDoses(d);
      setAdherence(a);
      setTrends(t);
    } catch {
      toast("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }

  async function markTaken(medicationId, scheduledTime) {
    try {
      await api.post(`/medications/${medicationId}/take`, { scheduledTime });
      toast("Dose marked as taken");
      fetchAll();
    } catch {
      toast("Failed to mark dose", "error");
    }
  }

  async function generateAiSummary() {
    setAiLoading(true);
    try {
      const result = await api.post("/reports/ai-summary", { days: 7 });
      setAiResult(result);
    } catch {
      toast("AI summary unavailable", "error");
    } finally {
      setAiLoading(false);
    }
  }

  const stats = summary
    ? [
        {
          label: "Active Medications",
          value: summary.activeMedications,
          icon: Pill,
          iconBg: "#dbeafe",
          iconColor: "#1d4ed8",
        },
        {
          label: "Today's Adherence",
          value: `${summary.dosesTakenToday}/${summary.totalDosesToday}`,
          sub: `${summary.adherenceRate}%`,
          icon: CheckCircle2,
          iconBg: "#dcfce7",
          iconColor: "#15803d",
        },
        {
          label: "Symptoms This Week",
          value: summary.symptomsLastWeek,
          sub: summary.avgSymptomSeverity ? `Avg ${summary.avgSymptomSeverity}/10` : "None",
          icon: Activity,
          iconBg: "#fef9c3",
          iconColor: "#854d0e",
        },
        {
          label: "Active Reminders",
          value: summary.activeReminders,
          icon: Bell,
          iconBg: "#ede9fe",
          iconColor: "#6d28d9",
        },
      ]
    : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={generateAiSummary}
          disabled={aiLoading}
        >
          <Sparkles size={15} />
          {aiLoading ? "Generating..." : "AI Health Summary"}
        </button>
      </div>

      {aiResult && (
        <div className="ai-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>AI Health Summary</span>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: "auto", fontSize: 12 }}
              onClick={() => setAiResult(null)}
            >
              Dismiss
            </button>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>{aiResult.summary}</p>
          <div className="grid-2" style={{ gap: "1rem" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 6 }}>
                Key Insights
              </p>
              <ul style={{ listStyle: "none" }}>
                {aiResult.keyInsights?.map((insight, i) => (
                  <li key={i} style={{ fontSize: 13, display: "flex", gap: 6, marginBottom: 4 }}>
                    <span style={{ color: "var(--primary)" }}>•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 6 }}>
                Recommendations
              </p>
              <ul style={{ listStyle: "none" }}>
                {aiResult.recommendations?.map((rec, i) => (
                  <li key={i} style={{ fontSize: 13, display: "flex", gap: 6, marginBottom: 4 }}>
                    <span style={{ color: "var(--success)" }}>•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 88 }} />
          ))}
        </div>
      ) : (
        <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p className="stat-label">{s.label}</p>
                  <p className="stat-value">{s.value}</p>
                  {s.sub && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.sub}</p>}
                </div>
                <div className="stat-icon" style={{ background: s.iconBg }}>
                  <s.icon size={17} color={s.iconColor} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div style={{ marginBottom: "1.5rem" }} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Overall Adherence Rate</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
              {summary.adherenceRate}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${summary.adherenceRate}%` }} />
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
            {summary.dosesTakenToday} of {summary.totalDosesToday} doses taken today
          </p>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Clock size={16} color="var(--text-muted)" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Today's Medications</span>
          </div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
            </div>
          ) : !doses.length ? (
            <div className="empty-state" style={{ padding: "1.5rem" }}>
              <CheckCircle2 size={36} color="var(--success)" style={{ opacity: 1, marginBottom: 8 }} />
              <p>No medications scheduled today</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {doses.map((dose) => (
                <div
                  key={`${dose.medicationId}-${dose.scheduledTime}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${dose.isTaken ? "#bbf7d0" : "var(--border)"}`,
                    background: dose.isTaken ? "#f0fdf4" : "white",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div
                      style={{ width: 10, height: 10, borderRadius: "50%", background: dose.color, flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {dose.medicationName}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {dose.dosage} · {dose.scheduledTime}
                      </p>
                    </div>
                  </div>
                  {dose.isTaken ? (
                    <span className="badge badge-green" style={{ flexShrink: 0 }}>
                      <CheckCircle2 size={11} style={{ marginRight: 4 }} />
                      Taken
                    </span>
                  ) : (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => markTaken(dose.medicationId, dose.scheduledTime)}
                      style={{ flexShrink: 0 }}
                    >
                      Mark Taken
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <TrendingUp size={16} color="var(--text-muted)" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>7-Day Adherence</span>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 180 }} />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={adherence} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-US", { weekday: "short" })
                  }
                />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  formatter={(v) => [`${v}%`, "Adherence"]}
                  labelFormatter={(l) => new Date(l).toLocaleDateString()}
                />
                <Bar dataKey="adherenceRate" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {trends.some((t) => t.avgSeverity > 0) && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertCircle size={16} color="var(--text-muted)" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Symptom Severity Trend (7 Days)</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={trends} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                }
              />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
              <Tooltip
                formatter={(v) => [`${v}`, "Avg Severity"]}
                labelFormatter={(l) => new Date(l).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="avgSeverity"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
