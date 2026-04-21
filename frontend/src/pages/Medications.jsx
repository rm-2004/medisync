import { useState, useEffect, useRef } from "react";
import { Plus, Pill, Edit2, Trash2, CheckCircle2, Clock, MoreVertical, X, Search } from "lucide-react";
import { api } from "../context/api.js";
import { searchMedicines, getDosagesForMedicine } from "../context/medicines.js";
import { useToast } from "../App.jsx";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];
const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "As needed"];
const DEFAULT_TIMES = {
  "Once daily": ["08:00"],
  "Twice daily": ["08:00", "20:00"],
  "Three times daily": ["08:00", "14:00", "20:00"],
  "Four times daily": ["06:00", "12:00", "18:00", "22:00"],
  "As needed": ["08:00"],
};

const emptyForm = {
  name: "", dosage: "", frequency: "Once daily", times: ["08:00"],
  startDate: new Date().toISOString().split("T")[0], endDate: "", notes: "", color: COLORS[0],
};

export default function Medications() {
  const toast = useToast();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [dosageSuggestions, setDosageSuggestions] = useState([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showDosageDropdown, setShowDosageDropdown] = useState(false);
  const nameRef = useRef(null);
  const dosageRef = useRef(null);

  useEffect(() => { fetchMedications(); }, []);

  useEffect(() => {
    function handleClick(e) {
      if (nameRef.current && !nameRef.current.contains(e.target)) setShowNameDropdown(false);
      if (dosageRef.current && !dosageRef.current.contains(e.target)) setShowDosageDropdown(false);
      setOpenMenuId(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchMedications() {
    setLoading(true);
    try { const data = await api.get("/medications"); setMedications(data); }
    catch { toast("Failed to load medications", "error"); }
    finally { setLoading(false); }
  }

  function openAdd() {
    setEditingId(null); setForm(emptyForm); setErrors({});
    setNameSuggestions([]); setDosageSuggestions([]);
    setDialogOpen(true);
  }

  function openEdit(med) {
    setEditingId(med._id);
    setForm({ name: med.name, dosage: med.dosage, frequency: med.frequency, times: [...med.times], startDate: med.startDate, endDate: med.endDate || "", notes: med.notes || "", color: med.color });
    setDosageSuggestions(getDosagesForMedicine(med.name));
    setErrors({}); setDialogOpen(true); setOpenMenuId(null);
  }

  function handleNameChange(val) {
    setForm((f) => ({ ...f, name: val, dosage: "" }));
    if (errors.name) setErrors((e) => { const n = { ...e }; delete n.name; return n; });
    const suggestions = searchMedicines(val);
    setNameSuggestions(suggestions);
    setShowNameDropdown(suggestions.length > 0);
    setDosageSuggestions([]);
  }

  function selectMedicine(med) {
    setForm((f) => ({ ...f, name: med.name, dosage: "" }));
    setDosageSuggestions(med.dosages);
    setNameSuggestions([]);
    setShowNameDropdown(false);
  }

  function selectDosage(dosage) {
    setForm((f) => ({ ...f, dosage }));
    setShowDosageDropdown(false);
    if (errors.dosage) setErrors((e) => { const n = { ...e }; delete n.dosage; return n; });
  }

  function handleDosageChange(val) {
    setForm((f) => ({ ...f, dosage: val }));
    if (errors.dosage) setErrors((e) => { const n = { ...e }; delete n.dosage; return n; });
  }

  function handleFrequencyChange(val) {
    setForm((f) => ({ ...f, frequency: val, times: [...(DEFAULT_TIMES[val] || ["08:00"])] }));
  }

  function updateTime(index, val) {
    setForm((f) => {
      const times = [...f.times];
      times[index] = val;
      return { ...f, times };
    });
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.dosage.trim()) e.dosage = "Dosage is required";
    if (!form.startDate) e.startDate = "Start date is required";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) return setErrors(e2);
    setSubmitting(true);
    const payload = { ...form, endDate: form.endDate || null, notes: form.notes || null };
    try {
      if (editingId) { await api.put(`/medications/${editingId}`, payload); toast("Medication updated"); }
      else { await api.post("/medications", payload); toast("Medication added"); }
      setDialogOpen(false);
      fetchMedications();
    } catch { toast("Failed to save medication", "error"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this medication?")) return;
    try { await api.delete(`/medications/${id}`); toast("Medication deleted"); fetchMedications(); }
    catch { toast("Failed to delete", "error"); }
    setOpenMenuId(null);
  }

  async function handleMarkTaken(id) {
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    try { await api.post(`/medications/${id}/take`, { scheduledTime: t }); toast("Dose recorded"); }
    catch { toast("Failed to record dose", "error"); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medications</h1>
          <p className="page-subtitle">Manage your medication regimen</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Medication
        </button>
      </div>

      {loading ? (
        <div className="grid-3">{[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}</div>
      ) : !medications.length ? (
        <div className="card empty-state">
          <Pill size={40} />
          <p>No medications added yet</p>
          <small>Track your daily medications here</small>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Your First Medication</button>
        </div>
      ) : (
        <div className="grid-3">
          {medications.map((med) => (
            <div key={med._id} className="card" style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: med.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{med.name}</p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{med.dosage}</p>
                  </div>
                </div>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-icon" onClick={() => setOpenMenuId(openMenuId === med._id ? null : med._id)}>
                    <MoreVertical size={15} />
                  </button>
                  {openMenuId === med._id && (
                    <div style={{ position: "absolute", right: 0, top: "100%", background: "white", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-md)", zIndex: 10, minWidth: 120, overflow: "hidden" }}>
                      <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", fontSize: 14, cursor: "pointer", border: "none", background: "none", color: "var(--text)" }} onMouseDown={() => openEdit(med)}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", fontSize: 14, cursor: "pointer", border: "none", background: "none", color: "var(--danger)" }} onMouseDown={() => handleDelete(med._id)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <Clock size={12} /><span>{med.frequency}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {med.times.map((t, ti) => <span key={`${t}-${ti}`} className="badge badge-blue">{t}</span>)}
                </div>
                {med.notes && <p style={{ marginTop: 6, fontStyle: "italic", fontSize: 12 }}>{med.notes}</p>}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                <span className={`badge ${med.isActive ? "badge-green" : "badge-gray"}`}>{med.isActive ? "Active" : "Inactive"}</span>
                <button className="btn btn-outline btn-sm" onClick={() => handleMarkTaken(med._id)}>
                  <CheckCircle2 size={13} /> Take Now
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
              <span className="modal-title">{editingId ? "Edit Medication" : "Add Medication"}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setDialogOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" ref={nameRef} style={{ position: "relative" }}>
                <label className="label">Medication Name</label>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 32 }}
                    placeholder="Type to search medicines..."
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => form.name.length >= 2 && setShowNameDropdown(nameSuggestions.length > 0)}
                    autoComplete="off"
                  />
                </div>
                {errors.name && <p className="form-error">{errors.name}</p>}
                {showNameDropdown && nameSuggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-md)", zIndex: 20, overflow: "hidden", marginTop: 2 }}>
                    {nameSuggestions.map((med) => (
                      <button
                        key={med.name}
                        type="button"
                        onMouseDown={() => selectMedicine(med)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "9px 14px", fontSize: 14, cursor: "pointer", border: "none", background: "none", textAlign: "left" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                      >
                        <span>{med.name}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{med.dosages[0]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" ref={dosageRef} style={{ position: "relative" }}>
                <label className="label">Dosage</label>
                <input
                  className="input"
                  placeholder={dosageSuggestions.length ? "Select or type dosage..." : "e.g. 500mg"}
                  value={form.dosage}
                  onChange={(e) => handleDosageChange(e.target.value)}
                  onFocus={() => dosageSuggestions.length > 0 && setShowDosageDropdown(true)}
                  autoComplete="off"
                />
                {errors.dosage && <p className="form-error">{errors.dosage}</p>}
                {showDosageDropdown && dosageSuggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-md)", zIndex: 20, overflow: "hidden", marginTop: 2 }}>
                    {dosageSuggestions.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onMouseDown={() => selectDosage(d)}
                        style={{ display: "block", width: "100%", padding: "9px 14px", fontSize: 14, cursor: "pointer", border: "none", background: "none", textAlign: "left" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="label">Frequency</label>
                <select className="input" value={form.frequency} onChange={(e) => handleFrequencyChange(e.target.value)}>
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Scheduled Times</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {form.times.map((t, i) => (
                    <input
                      key={i}
                      type="time"
                      className="input"
                      style={{ width: "auto", minWidth: 130 }}
                      value={t}
                      onChange={(e) => updateTime(i, e.target.value)}
                    />
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Adjust each time slot as needed</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={form.startDate} onChange={(e) => { setForm((f) => ({ ...f, startDate: e.target.value })); setErrors((e2) => { const n = { ...e2 }; delete n.startDate; return n; }); }} />
                  {errors.startDate && <p className="form-error">{errors.startDate}</p>}
                </div>
                <div className="form-group">
                  <label className="label">End Date (optional)</label>
                  <input type="date" className="input" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Notes (optional)</label>
                <textarea className="input" placeholder="e.g. Take with food" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="label">Color</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {COLORS.map((c) => (
                    <button key={c} type="button" className={`color-dot ${form.color === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setForm((f) => ({ ...f, color: c }))} />
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setDialogOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : editingId ? "Update" : "Add Medication"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}