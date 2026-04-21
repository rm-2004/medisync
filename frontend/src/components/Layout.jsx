import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Pill, Activity, Bell, Users, FileText, Menu, X, Heart, LogOut, Copy, Check, MessageCircle } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/symptoms", label: "Symptoms", icon: Activity },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/caretakers", label: "Family", icon: Users },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/consult", label: "AI Consult", icon: MessageCircle },
];

function SidebarContent({ user, onLogout, onNav }) {
  const [copied, setCopied] = useState(false);

  function copyId() {
    if (user.uniqueId) {
      navigator.clipboard.writeText(user.uniqueId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, background: "#2563eb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Heart size={17} color="white" fill="white" />
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>MediSync</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 1 }}>Health Tracker</div>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px" }}>
          <p style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{user.name}</p>
          {user.uniqueId && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {user.uniqueId}
              </p>
              <button onClick={copyId} title="Copy your Unique ID" style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#4ade80" : "rgba(255,255,255,0.4)", padding: 2, flexShrink: 0 }}>
                {copied ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </div>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }} onClick={onNav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8,
              fontSize: 14, fontWeight: 500, marginBottom: 2, transition: "all 0.15s",
              color: isActive ? "white" : "rgba(255,255,255,0.6)",
              background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
            })}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={onLogout}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.9)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
        >
          <LogOut size={16} /> Switch Account
        </button>
      </div>
    </>
  );
}

export default function Layout({ children, user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function openMenu() { setMobileOpen(true); }
  function closeMenu() { setMobileOpen(false); }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <style>{`
        #main-sidebar { display: flex; }
        .mobile-header { display: none !important; }
        @media (max-width: 768px) {
          #main-sidebar { display: none !important; }
          .mobile-header { display: flex !important; }
        }
        .mobile-sidebar-overlay {
          position: fixed; inset: 0; z-index: 50; display: flex;
          animation: fadeInOverlay 0.25s ease;
        }
        .mobile-sidebar-overlay .backdrop {
          position: absolute; inset: 0; background: rgba(0,0,0,0.5);
          animation: fadeIn 0.25s ease;
        }
        .mobile-sidebar-drawer {
          width: 260px; background: #1e293b; display: flex; flex-direction: column;
          height: 100vh; position: relative; z-index: 51;
          animation: slideInLeft 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
        }
        .mobile-sidebar-overlay.closing .mobile-sidebar-drawer {
          animation: slideOutLeft 0.25s cubic-bezier(0.55,0,1,0.45) forwards;
        }
        .mobile-sidebar-overlay.closing .backdrop {
          animation: fadeOut 0.25s ease forwards;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes slideOutLeft { from { transform: translateX(0); } to { transform: translateX(-100%); } }
      `}</style>

      <aside id="main-sidebar" style={{ width: 240, background: "#1e293b", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, flexShrink: 0 }}>
        <SidebarContent user={user} onLogout={onLogout} />
      </aside>

      {mobileOpen && (
        <div className="mobile-sidebar-overlay" onClick={closeMenu}>
          <div className="backdrop" />
          <aside className="mobile-sidebar-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 12, right: 12 }}>
              <button onClick={closeMenu} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <SidebarContent user={user} onLogout={onLogout} onNav={closeMenu} />
          </aside>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header className="mobile-header" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "white", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 40 }}>
          <button className="btn btn-ghost btn-icon" onClick={openMenu}>
            <Menu size={20} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, background: "#2563eb", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart size={13} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>MediSync</span>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)" }}>{user.name}</span>
        </header>
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}
