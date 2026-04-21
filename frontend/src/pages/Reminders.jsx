import { useState, useEffect } from "react";
import { Plus, Bell, Trash2, Clock, X } from "lucide-react";
import { api } from "../context/api.js";
import { useToast } from "../App.jsx";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Reminders() {
  const toast = useToast();
  const [reminders, setReminders] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ medicationId: "", time: "08:00", days: [...DAYS_OF_WEEK] });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [r, m] = await Promise.all([api.get("/reminders"), api.get("/medications")]);
      setReminders(r);
      setMedications(m);
    } catch {
      toast("Failed to load reminders", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = {};
    if (!form.medicationId) e2.medicationId = "Please select a medication";
    if (!form.days.length) e2.days = "Select at least one day";
    if (Object.keys(e2).length) return setErrors(e2);
    setSubmitting(true);
    try {
      await api.post("/reminders", { ...form, medicationId: form.medicationId });
      toast("Reminder created");
      setDialogOpen(false);
      setForm({ medicationId: "", time: "08:00", days: [...DAYS_OF_WEEK] });
      fetchAll();
    } catch {
      toast("Failed to create reminder", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleReminder(id, current) {
    try {
      await api.put(`/reminders/${id}`, { isEnabled: !current });
      fetchAll();
    } catch {
      toast("Failed to update reminder", "error");
    }
  }

  async function deleteReminder(id) {
    try {
      await api.delete(`/reminders/${id}`);
      toast("Reminder deleted");
      fetchAll();
    } catch {
      toast("Failed to delete", "error");
    }
  }

  function toggleDay(day) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
    setErrors((e) => { const n = { ...e }; delete n.days; return n; });
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="page-subtitle">Set up medication reminders</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ medicationId: "", time: "08:00", days: [...DAYS_OF_WEEK] }); setErrors({}); setDialogOpen(true); }}>
          <Plus size={16} /> Add Reminder
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 96 }} />)}
        </div>
      ) : !reminders.length ? (
        <div className="card empty-state">
          <Bell size={40} />
          <p>No reminders set up</p>
          <small>Never miss a dose with smart reminders</small>
          <button className="btn btn-primary" onClick={() => { setForm({ medicationId: "", time: "08:00", days: [...DAYS_OF_WEEK] }); setErrors({}); setDialogOpen(true); }}>
            <Plus size={15} /> Create Your First Reminder
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reminders.map((r) => (
            <div key={r._id} className="card" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600 }}>{r.medicationName}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-muted)" }}>
                    <Clock size={13} />{r.time}
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {r.days.map((day) => (
                    <span key={day} className="badge badge-blue" style={{ padding: "2px 7px" }}>{day.slice(0, 3)}</span>
                  ))}
                </div>
                {r.lastSent && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                    Last sent: {new Date(r.lastSent).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <label className="switch" title={r.isEnabled ? "Disable" : "Enable"}>
                  <input type="checkbox" checked={r.isEnabled} onChange={() => toggleReminder(r._id, r.isEnabled)} />
                  <span className="switch-track" />
                </label>
                <button className="btn btn-ghost btn-icon" style={{ color: "var(--text-muted)" }} onClick={() => deleteReminder(r._id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dialogOpen && (
        <div className="modal-overlay" onClick={() => setDialogOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Reminder</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setDialogOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Medication</label>
                <select
                  className="input"
                  value={form.medicationId}
                  onChange={(e) => { setForm((f) => ({ ...f, medicationId: e.target.value })); setErrors((e2) => { const n = { ...e2 }; delete n.medicationId; return n; }); }}
                >
                  <option value="">Select medication...</option>
                  {medications.map((m) => (
                    <option key={m._id} value={m._id}>{m.name} — {m.dosage}</option>
                  ))}
                </select>
                {errors.medicationId && <p className="form-error">{errors.medicationId}</p>}
              </div>

              <div className="form-group">
                <label className="label">Time</label>
                <input type="time" className="input" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="label">Days</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {DAYS_OF_WEEK.map((day) => (
                    <button key={day} type="button" className={`tag-pill ${form.days.includes(day) ? "active" : ""}`} onClick={() => toggleDay(day)}>
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                {errors.days && <p className="form-error">{errors.days}</p>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setDialogOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
