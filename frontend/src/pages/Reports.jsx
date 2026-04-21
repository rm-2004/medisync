import { useState } from "react";
import { FileText, Printer, Sparkles, Pill, Activity, TrendingUp, Calendar, AlertCircle, CheckCircle2, Info, HeartPulse } from "lucide-react";
import { api } from "../context/api.js";
import { useToast } from "../App.jsx";

const defaultStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
};

const SEVERITY_LABELS = {
  1: "Very Mild", 2: "Very Mild", 3: "Mild", 4: "Mild",
  5: "Moderate", 6: "Moderate", 7: "Severe", 8: "Severe",
  9: "Extreme", 10: "Extreme",
};

function severityColor(s) {
  if (s <= 4) return { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  if (s <= 6) return { color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
}

function AdherenceMeter({ rate }) {
  const color = rate >= 80 ? "#16a34a" : rate >= 50 ? "#d97706" : "#dc2626";
  const label = rate >= 80 ? "Great" : rate >= 50 ? "Fair" : "Needs Improvement";
  return (
    <div style={{ padding: "16px 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontWeight: 600, fontSize: 14 }}>Medication Adherence</p>
        <span style={{ fontWeight: 800, fontSize: 22, color }}>{rate}%</span>
      </div>
      <div style={{ height: 10, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${rate}%`, background: color, borderRadius: 999, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        {rate >= 80 ? <CheckCircle2 size={13} color={color} /> : <Info size={13} color={color} />}
        <p style={{ fontSize: 12, color, fontWeight: 500 }}>{label} — {rate >= 80 ? "Keep it up!" : rate >= 50 ? "Try to take medications more consistently." : "Missing many doses can reduce treatment effectiveness."}</p>
      </div>
    </div>
  );
}

export default function Reports() {
  const toast = useToast();
  const [form, setForm] = useState({
    startDate: defaultStart(),
    endDate: new Date().toISOString().split("T")[0],
    includeSymptoms: true,
    includeMedications: true,
    includeAdherence: true,
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setReport(null);
    try {
      const data = await api.post("/reports/generate", form);
      setReport(data);
      toast("Report generated successfully");
    } catch {
      toast("Failed to generate report", "error");
    } finally {
      setLoading(false);
    }
  }

  const totalDays = report
    ? Math.ceil((new Date(report.endDate) - new Date(report.startDate)) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div className="page">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Health Reports</h1>
          <p className="page-subtitle">Generate comprehensive health summaries</p>
        </div>
        {report && (
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={15} /> Print / Save PDF
          </button>
        )}
      </div>

      {/* Settings */}
      <div className="card no-print" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Calendar size={16} color="var(--text-muted)" />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Report Settings</span>
        </div>
        <form onSubmit={handleGenerate}>
          <div className="form-row">
            <div className="form-group">
              <label className="label">Start Date</label>
              <input type="date" className="input" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">End Date</label>
              <input type="date" className="input" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <p className="label">Include in report:</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { key: "includeMedications", label: "Medications", icon: Pill },
                { key: "includeSymptoms", label: "Symptoms", icon: Activity },
                { key: "includeAdherence", label: "Adherence", icon: TrendingUp },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", border: `1px solid ${form[key] ? "var(--primary)" : "var(--border)"}`, borderRadius: 8, cursor: "pointer", background: form[key] ? "var(--primary-light)" : "white", fontSize: 14, userSelect: "none" }}>
                  <input type="checkbox" checked={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} style={{ display: "none" }} />
                  <Icon size={14} color={form[key] ? "var(--primary)" : "var(--text-muted)"} />
                  <span style={{ color: form[key] ? "var(--primary)" : "var(--text-muted)", fontWeight: 500 }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            <FileText size={15} />
            {loading ? "Generating Report..." : "Generate Health Report"}
          </button>
        </form>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2].map((j) => <div key={j} className="skeleton" style={{ height: i === 1 ? 24 : 14, width: i === 1 ? "60%" : "90%" }} />)}
            </div>
          ))}
        </div>
      )}

      {/* Report */}
      {report && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Header card */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <HeartPulse size={20} color="var(--primary)" />
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Health Report</h2>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {new Date(report.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} —{" "}
                  {new Date(report.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  {" "}({totalDays} days)
                </p>
              </div>
              <span className="badge badge-gray">Generated {new Date(report.generatedAt).toLocaleDateString()}</span>
            </div>

            {/* Quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: form.includeAdherence && report.adherenceRate >= 0 ? 16 : 0 }}>
              {[
                { label: "Medications", value: report.medications?.length ?? 0, color: "#2563eb", bg: "#eff6ff" },
                { label: "Symptoms Logged", value: report.symptoms?.length ?? 0, color: "#d97706", bg: "#fffbeb" },
                { label: "Period (days)", value: totalDays, color: "#7c3aed", bg: "#f5f3ff" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{ background: bg, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color }}>{value}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</p>
                </div>
              ))}
            </div>

            {form.includeAdherence && report.adherenceRate >= 0 && (
              <AdherenceMeter rate={report.adherenceRate} />
            )}
          </div>

          {/* AI Summary */}
          {report.aiSummary && (
            <div className="ai-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Sparkles size={16} color="var(--primary)" />
                <span style={{ fontWeight: 600, fontSize: 15 }}>AI Health Summary</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text)", whiteSpace: "pre-wrap" }}>{report.aiSummary}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                This summary is AI-generated for informational purposes only and does not constitute medical advice. Consult a qualified healthcare professional for diagnosis and treatment.
              </p>
            </div>
          )}

          {/* Medications */}
          {report.medications?.length > 0 && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Pill size={16} color="var(--text-muted)" />
                <span style={{ fontWeight: 600, fontSize: 15 }}>Medications ({report.medications.length})</span>
              </div>
              <div>
                {report.medications.map((m) => (
                  <div key={m._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.color || "#2563eb", flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</span>
                        <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 8 }}>{m.dosage} · {m.frequency}</span>
                      </div>
                    </div>
                    <span className={`badge ${m.isActive ? "badge-green" : "badge-gray"}`}>{m.isActive ? "Active" : "Inactive"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Symptoms */}
          {report.symptoms?.length > 0 && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Activity size={16} color="var(--text-muted)" />
                <span style={{ fontWeight: 600, fontSize: 15 }}>Symptoms ({report.symptoms.length})</span>
              </div>
              {/* Group by symptom name for clarity */}
              <div>
                {report.symptoms.map((s) => {
                  const sc = severityColor(s.severity);
                  return (
                    <div key={s._id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{s.symptom}</span>
                          {s.tags?.length > 0 && s.tags.map((t) => (
                            <span key={t} className="badge badge-gray" style={{ padding: "1px 7px" }}>{t}</span>
                          ))}
                        </div>
                        {s.notes && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>{s.notes}</p>}
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                          {new Date(s.loggedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: sc.color, background: sc.bg, border: "1px solid " + sc.border, borderRadius: 999, padding: "3px 10px", display: "inline-block" }}>
                          {s.severity}/10
                        </span>
                        <p style={{ fontSize: 11, color: sc.color, marginTop: 4, fontWeight: 500 }}>{SEVERITY_LABELS[s.severity]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No data notice */}
          {!report.medications?.length && !report.symptoms?.length && (
            <div className="card empty-state" style={{ padding: "2rem" }}>
              <AlertCircle size={32} color="var(--text-muted)" />
              <p>No data found for this period</p>
              <small>Try adjusting your date range or add medications and symptoms first</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
