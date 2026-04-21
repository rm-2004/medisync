import { useState, useEffect } from "react";
import { Plus, Activity, Trash2, TrendingUp, X, Smile, Meh, Frown, AlertTriangle, ZapOff } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "../context/api.js";
import { useToast } from "../App.jsx";

const TAGS = ["head", "stomach", "joints", "energy", "skin", "chest", "breathing", "mood", "pain", "other"];

const SEVERITY_OPTIONS = [
  { value: 2, label: "Very Mild", emoji: "🙂", desc: "Barely noticeable", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  { value: 4, label: "Mild",      emoji: "😐", desc: "Noticeable but manageable", color: "#65a30d", bg: "#f7fee7", border: "#d9f99d" },
  { value: 6, label: "Moderate",  emoji: "😟", desc: "Uncomfortable, affecting daily life", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { value: 8, label: "Severe",    emoji: "😣", desc: "Very painful or distressing", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  { value: 10, label: "Extreme",  emoji: "🚨", desc: "Unbearable — seek help immediately", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
];

function getSeverityOption(val) {
  return SEVERITY_OPTIONS.reduce((prev, curr) =>
    Math.abs(curr.value - val) < Math.abs(prev.value - val) ? curr : prev
  );
}

function severityColor(s) {
  if (s <= 3) return "#16a34a";
  if (s <= 6) return "#d97706";
  return "#dc2626";
}

const emptyForm = { symptom: "", severity: 6, notes: "", tags: [] };

export default function Symptoms() {
  const toast = useToast();
  const [symptoms, setSymptoms] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchSymptoms(); }, [days]);
  useEffect(() => { fetchTrends(); }, []);

  async function fetchSymptoms() {
    setLoading(true);
    try { const data = await api.get(`/symptoms?days=${days}`); setSymptoms(data); }
    catch { toast("Failed to load symptoms", "error"); }
    finally { setLoading(false); }
  }

  async function fetchTrends() {
    try { const data = await api.get("/symptoms/trends?days=14"); setTrends(data); }
    catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.symptom.trim()) return setErrors({ symptom: "Please describe your symptom" });
    setSubmitting(true);
    try {
      await api.post("/symptoms", { ...form, notes: form.notes || null });
      toast("Symptom logged");
      setDialogOpen(false);
      setForm(emptyForm);
      fetchSymptoms();
      fetchTrends();
    } catch { toast("Failed to log symptom", "error"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id) {
    try { await api.delete(`/symptoms/${id}`); toast("Symptom removed"); fetchSymptoms(); fetchTrends(); }
    catch { toast("Failed to delete", "error"); }
  }

  function toggleTag(tag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  const selectedOption = getSeverityOption(form.severity);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Symptoms</h1>
          <p className="page-subtitle">Track and analyze your symptoms</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setDialogOpen(true); }}>
          <Plus size={16} /> Log Symptom
        </button>
      </div>

      {trends.some((t) => t.avgSeverity > 0) && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <TrendingUp size={16} color="var(--text-muted)" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>14-Day Severity Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trends} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
              <Tooltip formatter={(v) => [`${v}`, "Avg Severity"]} labelFormatter={(l) => new Date(l).toLocaleDateString()} />
              <Area type="monotone" dataKey="avgSeverity" stroke="#f59e0b" fill="url(#sGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="filter-bar">
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Show last:</span>
        {[7, 14, 30, 90].map((d) => (
          <button key={d} className={`filter-btn ${days === d ? "active" : ""}`} onClick={() => setDays(d)}>
            {d} days
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : !symptoms.length ? (
        <div className="card empty-state">
          <Activity size={40} />
          <p>No symptoms logged</p>
          <small>Start tracking how you feel</small>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setDialogOpen(true); }}>
            <Plus size={15} /> Log Your First Symptom
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {symptoms.map((s) => {
            const opt = getSeverityOption(s.severity);
            return (
              <div key={s._id} className="card" style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>{s.symptom}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: opt.color, background: opt.bg, border: "1px solid " + opt.border, borderRadius: 999, padding: "2px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                        {opt.emoji} {opt.label}
                      </span>
                    </div>
                    {s.notes && <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>{s.notes}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(s.loggedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {s.tags.map((tag) => (
                        <span key={tag} className="badge badge-gray" style={{ padding: "1px 7px" }}>{tag}</span>
                      ))}
                    </div>
                    <div className="severity-bar">
                      <div style={{ height: "100%", width: `${(s.severity / 10) * 100}%`, background: opt.color, borderRadius: 999, transition: "width 0.4s" }} />
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-icon" style={{ color: "var(--text-muted)" }} onClick={() => handleDelete(s._id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <div className="modal-overlay" onClick={() => setDialogOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">How are you feeling?</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setDialogOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">What is bothering you?</label>
                <input className="input" placeholder="e.g. Headache, Stomach pain, Fatigue..." value={form.symptom}
                  onChange={(e) => { setForm((f) => ({ ...f, symptom: e.target.value })); setErrors({}); }} />
                {errors.symptom && <p className="form-error">{errors.symptom}</p>}
              </div>

              <div className="form-group">
                <label className="label" style={{ marginBottom: 10 }}>How bad does it feel?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, severity: opt.value }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                        border: `2px solid ${form.severity === opt.value ? opt.color : "var(--border)"}`,
                        borderRadius: 12, cursor: "pointer",
                        background: form.severity === opt.value ? opt.bg : "white",
                        transition: "all 0.15s", textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 26, lineHeight: 1 }}>{opt.emoji}</span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 15, color: form.severity === opt.value ? opt.color : "var(--text)" }}>{opt.label}</p>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 1 }}>{opt.desc}</p>
                      </div>
                      {form.severity === opt.value && (
                        <div style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: "50%", background: opt.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Body area (select all that apply)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {TAGS.map((tag) => (
                    <button key={tag} type="button" className={`tag-pill ${form.tags.includes(tag) ? "active" : ""}`} onClick={() => toggleTag(tag)}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Any additional details? (optional)</label>
                <textarea className="input" placeholder="e.g. Started after lunch, came with dizziness..." rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setDialogOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Log Symptom"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
