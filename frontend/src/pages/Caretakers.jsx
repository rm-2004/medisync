import { useState, useEffect } from "react";
import { Plus, Users, Trash2, Mail, Shield, Pill, Activity, X, Hash, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../context/api.js";
import { useToast } from "../App.jsx";

const RELATIONSHIPS = ["Spouse", "Child", "Parent", "Sibling", "Friend", "Primary Doctor", "Specialist", "Caregiver", "Other"];
const emptyForm = { name: "", email: "", relationship: "", canViewMedications: true, canViewSymptoms: true, uniqueId: "" };

export default function Caretakers() {
  const toast = useToast();
  const [caretakers, setCaretakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [addMode, setAddMode] = useState("manual");
  const [expandedId, setExpandedId] = useState(null);
  const [memberData, setMemberData] = useState({});

  useEffect(() => { fetchCaretakers(); }, []);

  async function fetchCaretakers() {
    setLoading(true);
    try { const data = await api.get("/caretakers"); setCaretakers(data); }
    catch { toast("Failed to load", "error"); }
    finally { setLoading(false); }
  }

  async function toggleExpand(caretaker) {
    if (expandedId === caretaker._id) { setExpandedId(null); return; }
    if (!caretaker.caretakerUserId) { setExpandedId(caretaker._id); return; }
    try {
      const data = await api.get(`/caretakers/member-data/${caretaker._id}`);
      setMemberData((prev) => ({ ...prev, [caretaker._id]: data }));
    } catch { toast("Could not load member data", "error"); }
    setExpandedId(caretaker._id);
  }

  function validate() {
    const e = {};
    if (addMode === "id") {
      if (!form.uniqueId.trim()) e.uniqueId = "Please enter a Unique ID";
      if (!form.relationship) e.relationship = "Please select a relationship";
    } else {
      if (!form.name.trim()) e.name = "Name is required";
      if (!form.relationship) e.relationship = "Please select a relationship";
    }
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) return setErrors(e2);
    setSubmitting(true);
    try {
      const payload = addMode === "id"
        ? { uniqueId: form.uniqueId.trim(), relationship: form.relationship, canViewMedications: form.canViewMedications, canViewSymptoms: form.canViewSymptoms, name: form.name || "Linked User" }
        : { name: form.name, email: form.email, relationship: form.relationship, canViewMedications: form.canViewMedications, canViewSymptoms: form.canViewSymptoms };
      await api.post("/caretakers", payload);
      toast("Contact added");
      setDialogOpen(false);
      setForm(emptyForm);
      fetchCaretakers();
    } catch (err) {
      toast(err.message || "Failed to add", "error");
    } finally { setSubmitting(false); }
  }

  async function handleRemove(id) {
    if (!confirm("Remove this contact?")) return;
    try { await api.delete(`/caretakers/${id}`); toast("Contact removed"); fetchCaretakers(); }
    catch { toast("Failed to remove", "error"); }
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  const myUniqueId = localStorage.getItem("medisync_unique_id");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Family Sharing</h1>
          <p className="page-subtitle">Share your health data with trusted people</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setAddMode("manual"); setDialogOpen(true); }}>
          <Plus size={16} /> Add Person
        </button>
      </div>

      {myUniqueId && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Hash size={17} color="#2563eb" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: "#1e40af" }}>Your Unique ID</p>
            <p style={{ fontFamily: "monospace", fontSize: 13, color: "#1d4ed8", marginTop: 2, wordBreak: "break-all" }}>{myUniqueId}</p>
            <p style={{ fontSize: 12, color: "#3b82f6", marginTop: 3 }}>Share this with family members so they can add you to their account</p>
          </div>
        </div>
      )}

      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Shield size={17} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: "#15803d" }}>
          Contacts added manually are for personal reference only. Link via Unique ID to view their actual live health data (with their permission).
        </p>
      </div>

      {loading ? (
        <div className="grid-2">{[1,2].map((i) => <div key={i} className="skeleton" style={{ height: 130 }} />)}</div>
      ) : !caretakers.length ? (
        <div className="card empty-state">
          <Users size={40} />
          <p>No contacts added yet</p>
          <small>Add family members or doctors manually or by their Unique ID</small>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setAddMode("manual"); setDialogOpen(true); }}>
            <Plus size={15} /> Add Your First Contact
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {caretakers.map((c) => (
            <div key={c._id} className="card" style={{ padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <p style={{ fontWeight: 600 }}>{c.name}</p>
                    <span className="badge badge-gray">{c.relationship}</span>
                    {c.caretakerUserId && <span className="badge badge-blue">Linked</span>}
                  </div>
                  {c.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                      <Mail size={12} /><span>{c.email}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    {c.canViewMedications && <span className="badge badge-green" style={{ fontSize: 11 }}><Pill size={10} style={{ marginRight: 3 }} />Meds</span>}
                    {c.canViewSymptoms && <span className="badge badge-green" style={{ fontSize: 11 }}><Activity size={10} style={{ marginRight: 3 }} />Symptoms</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  {c.caretakerUserId && (
                    <button className="btn btn-outline btn-sm" onClick={() => toggleExpand(c)} style={{ gap: 4 }}>
                      <Eye size={13} />
                      {expandedId === c._id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                  <button className="btn btn-ghost btn-icon" style={{ color: "var(--text-muted)" }} onClick={() => handleRemove(c._id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expandedId === c._id && c.caretakerUserId && memberData[c._id] && (
                <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-muted)" }}>
                    {memberData[c._id].name}'s Health Data
                  </p>
                  {memberData[c._id].medications && (
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>Active Medications</p>
                      {memberData[c._id].medications.length === 0 ? (
                        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>None</p>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {memberData[c._id].medications.map((m) => (
                            <span key={m._id} className="badge badge-blue">{m.name} {m.dosage}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {memberData[c._id].symptoms && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>Recent Symptoms (30 days)</p>
                      {memberData[c._id].symptoms.length === 0 ? (
                        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>None logged</p>
                      ) : (
                        memberData[c._id].symptoms.slice(0, 5).map((s) => (
                          <div key={s._id} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                            <span>{s.symptom}</span>
                            <span style={{ color: "var(--text-muted)" }}>{s.severity}/10 · {new Date(s.loggedAt).toLocaleDateString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {dialogOpen && (
        <div className="modal-overlay" onClick={() => setDialogOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Contact</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setDialogOpen(false)}><X size={18} /></button>
            </div>

            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 4, marginBottom: "1.25rem" }}>
              {["manual", "id"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setAddMode(m); setErrors({}); }}
                  style={{ flex: 1, padding: "7px 10px", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", background: addMode === m ? "white" : "transparent", color: addMode === m ? "#0f172a" : "#64748b", boxShadow: addMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
                >
                  {m === "manual" ? "Add Manually" : "Link by Unique ID"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {addMode === "id" ? (
                <div className="form-group">
                  <label className="label">Their Unique ID</label>
                  <div style={{ position: "relative" }}>
                    <Hash size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input className="input" style={{ paddingLeft: 30, fontFamily: "monospace", fontSize: 13 }} placeholder="Paste their unique ID" value={form.uniqueId} onChange={(e) => setField("uniqueId", e.target.value)} />
                  </div>
                  {errors.uniqueId && <p className="form-error">{errors.uniqueId}</p>}
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>They can find their Unique ID in their sidebar or Family page</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="label">Full Name</label>
                    <input className="input" placeholder="e.g. Dr. Jane Smith" value={form.name} onChange={(e) => setField("name", e.target.value)} />
                    {errors.name && <p className="form-error">{errors.name}</p>}
                  </div>
                  <div className="form-group">
                    <label className="label">Email (optional)</label>
                    <input type="email" className="input" placeholder="email@example.com" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="label">Relationship</label>
                <select className="input" value={form.relationship} onChange={(e) => setField("relationship", e.target.value)}>
                  <option value="">Select relationship...</option>
                  {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.relationship && <p className="form-error">{errors.relationship}</p>}
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginBottom: 4 }}>
                <p className="label" style={{ marginBottom: 10 }}>Permissions (for linked accounts)</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[{ key: "canViewMedications", label: "Can view medications", Icon: Pill }, { key: "canViewSymptoms", label: "Can view symptoms", Icon: Activity }].map(({ key, label, Icon }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                        <Icon size={15} color="var(--text-muted)" /> {label}
                      </div>
                      <label className="switch">
                        <input type="checkbox" checked={form[key]} onChange={(e) => setField(key, e.target.checked)} />
                        <span className="switch-track" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setDialogOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}