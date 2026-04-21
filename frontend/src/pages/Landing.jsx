import { useState } from "react";
import { Heart, ArrowRight, User, Hash, Copy, Check, Pill, Activity, Bell, Shield, ChevronRight, Sparkles, Users } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const FEATURES = [
  { icon: Pill, color: "#2563eb", title: "Medication Tracking", desc: "Never miss a dose. Track all your medications, dosages, and schedules in one place." },
  { icon: Activity, color: "#16a34a", title: "Symptom Logging", desc: "Log how you feel daily. Spot patterns and share accurate history with your doctor." },
  { icon: Bell, color: "#d97706", title: "Smart Reminders", desc: "Get timely reminders for medications so your routine stays on track effortlessly." },
  { icon: Users, color: "#7c3aed", title: "Family Care", desc: "Add caretakers or family members who can monitor your health alongside you." },
  { icon: Sparkles, color: "#db2777", title: "AI Health Insights", desc: "Get AI-generated health summaries and consult our AI health assistant anytime." },
  { icon: Shield, color: "#0891b2", title: "Private & Secure", desc: "No passwords, no emails. Just your unique ID — simple and completely private." },
];

export default function Landing({ onLogin }) {
  const [screen, setScreen] = useState("hero");
  const [tab, setTab] = useState("new");
  const [name, setName] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter your name");
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE_URL}/users/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewUser(data);
      setScreen("success");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!uniqueId.trim()) return setError("Please enter your Unique ID");
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId: uniqueId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("medisync_user_id", data._id);
      localStorage.setItem("medisync_user_name", data.name);
      localStorage.setItem("medisync_unique_id", data.uniqueId);
      onLogin(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function copyId() {
    navigator.clipboard.writeText(newUser.uniqueId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function enterDashboard() {
    localStorage.setItem("medisync_user_id", newUser._id);
    localStorage.setItem("medisync_user_name", newUser.name);
    localStorage.setItem("medisync_unique_id", newUser.uniqueId);
    onLogin(newUser);
  }

  if (screen === "success" && newUser) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ width: 52, height: 52, background: "#2563eb", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Heart size={24} color="white" fill="white" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>MediSync</h1>
          </div>
          <div style={{ background: "white", borderRadius: 20, padding: "2rem", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ width: 52, height: 52, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Check size={24} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Welcome, {newUser.name}!</h2>
              <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Your account has been created successfully.</p>
            </div>
            <div style={{ background: "#f8fafc", border: "2px solid #e2e8f0", borderRadius: 12, padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Your Unique ID (Save this!)</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <code style={{ flex: 1, fontSize: 13, fontFamily: "monospace", color: "#1e293b", wordBreak: "break-all", lineHeight: 1.5 }}>{newUser.uniqueId}</code>
                <button onClick={copyId} style={{ padding: "8px 12px", background: copied ? "#dcfce7" : "#eff6ff", border: "none", borderRadius: 8, cursor: "pointer", color: copied ? "#16a34a" : "#2563eb", flexShrink: 0, transition: "all 0.2s", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                  {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>
            <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: "1.5rem", fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
              <strong>Save this ID!</strong> You will need it to log in on other devices or after clearing your browser. We cannot recover it for you.
            </div>
            <button onClick={enterDashboard} style={{ width: "100%", padding: "13px", background: "#2563eb", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              Go to Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "auth") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <button onClick={() => { setScreen("hero"); setError(""); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", fontSize: 14, cursor: "pointer", marginBottom: "1.5rem", fontWeight: 500 }}>
            Back to Home
          </button>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ width: 52, height: 52, background: "#2563eb", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Heart size={24} color="white" fill="white" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>MediSync</h1>
            <p style={{ color: "#64748b", marginTop: 4, fontSize: 14 }}>Your personal health companion</p>
          </div>
          <div style={{ background: "white", borderRadius: 20, padding: "2rem", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: "1.5rem" }}>
              {["new", "existing"].map((t) => (
                <button key={t} onClick={() => { setTab(t); setError(""); }}
                  style={{ flex: 1, padding: "9px 12px", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", background: tab === t ? "white" : "transparent", color: tab === t ? "#0f172a" : "#64748b", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.12)" : "none" }}>
                  {t === "new" ? "New Account" : "I have an ID"}
                </button>
              ))}
            </div>
            {tab === "new" ? (
              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 7, color: "#374151" }}>Your Name</label>
                  <div style={{ position: "relative" }}>
                    <User size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input className="input" style={{ paddingLeft: 38 }} placeholder="e.g. Ramesh Kumar" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} autoFocus />
                  </div>
                </div>
                {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12, background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}>{error}</p>}
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: "#2563eb", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loading ? "Creating account..." : <> Create Account <ArrowRight size={16} /> </>}
                </button>
                <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>No email or password needed</p>
              </form>
            ) : (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 7, color: "#374151" }}>Your Unique ID</label>
                  <div style={{ position: "relative" }}>
                    <Hash size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input className="input" style={{ paddingLeft: 38, fontFamily: "monospace", fontSize: 13 }} placeholder="Paste your unique ID here" value={uniqueId} onChange={(e) => { setUniqueId(e.target.value); setError(""); }} autoFocus />
                  </div>
                </div>
                {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 12, background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}>{error}</p>}
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", background: "#2563eb", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loading ? "Logging in..." : <> Enter Dashboard <ArrowRight size={16} /> </>}
                </button>
                <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>Your unique ID was shown when you first created your account</p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", overflowX: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hero-animate { animation: fadeUp 0.6s ease forwards; }
        .feature-card:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.14) !important; transform: translateY(-3px); }
        .cta-btn:hover { background: #1d4ed8 !important; transform: translateY(-1px); }
        .outline-btn:hover { background: rgba(255,255,255,0.12) !important; }
        @media (max-width: 600px) {
          .hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .hero-btns button { justify-content: center; }
          .stats-bar { flex-direction: row !important; flex-wrap: wrap !important; gap: 1.5rem !important; }
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "#2563eb", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={17} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>MediSync</span>
        </div>
        <button onClick={() => setScreen("auth")} className="cta-btn" style={{ background: "white", color: "#0f172a", border: "none", borderRadius: 10, padding: "9px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>
          Get Started
        </button>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "5rem 2rem 4rem", textAlign: "center" }} className="hero-animate">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 999, padding: "6px 16px", marginBottom: "2rem", fontSize: 13, color: "#93c5fd", fontWeight: 500 }}>
          <Sparkles size={13} /> AI-Powered Health Tracking
        </div>
        <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 3.8rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.5rem", background: "linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Your Health,<br />Tracked Simply.
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.15rem)", color: "#94a3b8", maxWidth: 540, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
          MediSync helps you track medications, log symptoms, set reminders, and get AI-powered health insights — all in one beautiful, easy-to-use app.
        </p>
        <div className="hero-btns" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setScreen("auth")} className="cta-btn" style={{ display: "flex", alignItems: "center", gap: 8, background: "#2563eb", color: "white", border: "none", borderRadius: 12, padding: "14px 28px", fontWeight: 700, fontSize: 16, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 24px rgba(37,99,235,0.4)" }}>
            Get Started Free <ArrowRight size={17} />
          </button>
          <button onClick={() => { setTab("existing"); setScreen("auth"); }} className="outline-btn" style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.07)", color: "white", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 28px", fontWeight: 600, fontSize: 15, cursor: "pointer", transition: "all 0.2s" }}>
            I already have an ID <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", padding: "1.5rem 2rem" }}>
        <div className="stats-bar" style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-around", gap: "1.5rem" }}>
          {[["No Sign-up", "Just your name"], ["100% Private", "No email needed"], ["Always Free", "No hidden charges"], ["AI-Powered", "Smart health insights"]].map(([title, sub]) => (
            <div key={title} style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: 17, color: "white" }}>{title}</p>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "5rem 2rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem, 4vw, 2.1rem)", fontWeight: 800, marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
          Everything you need, nothing you do not.
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: 15, marginBottom: "3rem", maxWidth: 460, margin: "0 auto 3rem" }}>
          Built with simplicity in mind for all ages — from tech-savvy to first-time users.
        </p>
        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="feature-card" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", transition: "all 0.25s ease" }}>
              <div style={{ width: 44, height: 44, background: color + "22", border: "1px solid " + color + "44", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: "white" }}>{title}</h3>
              <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(16,185,129,0.1) 100%)", border: "1px solid rgba(37,99,235,0.2)", margin: "0 2rem 4rem", borderRadius: 24, padding: "3rem 2rem", textAlign: "center", maxWidth: 800, marginLeft: "auto", marginRight: "auto" }}>
        <Heart size={36} color="#2563eb" fill="#2563eb" style={{ marginBottom: "1rem" }} />
        <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, marginBottom: "0.75rem" }}>Start tracking your health today</h2>
        <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: "2rem" }}>No registration, no passwords. Create your free account in seconds.</p>
        <button onClick={() => setScreen("auth")} className="cta-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "white", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 24px rgba(37,99,235,0.4)", transition: "all 0.2s" }}>
          Get Started Free <ArrowRight size={17} />
        </button>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem 2rem", textAlign: "center", color: "#475569", fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
          <Heart size={13} color="#2563eb" fill="#2563eb" />
          <span style={{ fontWeight: 700, color: "#94a3b8" }}>MediSync</span>
        </div>
        <p>Your personal health companion. Always private, always free.</p>
      </div>
    </div>
  );
}
