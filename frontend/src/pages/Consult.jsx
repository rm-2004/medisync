import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Bot, User, AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "../context/api.js";

const INITIAL_MSG = {
  role: "assistant",
  content:
    "Hello! I am your MediSync Health Assistant. I am here to help you understand your symptoms and guide you with basic health advice.\n\nPlease tell me what you are experiencing today. How are you feeling?",
};

export default function Consult() {
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await api.get("/consult/history");
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      } catch {
        // no history yet, use default
      } finally {
        setHistoryLoading(false);
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const data = await api.post("/consult/chat", { messages: updatedMessages });
      const reply = data.reply || "I am sorry, I could not generate a response. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message || "Could not reach the AI assistant. Please check your connection and try again.");
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function resetChat() {
    try {
      await api.delete("/consult/history");
    } catch {
      // ignore
    }
    setMessages([INITIAL_MSG]);
    setError("");
    setInput("");
  }

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 0px)", padding: 0 }}>
      <style>{`
        .chat-bubble { animation: fadeUp 0.3s ease forwards; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .typing-dot { animation: bounce 1.2s infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
      `}</style>

      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", background: "white", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageCircle size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>AI Health Consultant</h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Personalised advice based on your health data</p>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={resetChat} style={{ gap: 6 }}>
          <RefreshCw size={13} /> New Chat
        </button>
      </div>

      <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "10px 16px", display: "flex", alignItems: "flex-start", gap: 8, flexShrink: 0 }}>
        <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
          <strong>Important:</strong> This AI provides general health guidance only and is not a substitute for professional medical advice. Always consult a qualified doctor for diagnosis and treatment.
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 14, background: "#f8fafc" }}>
        {historyLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, color: "var(--text-muted)", fontSize: 14 }}>
            Loading your conversation history...
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="chat-bubble" style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: msg.role === "user" ? "#2563eb" : "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
                {msg.role === "user" ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
              </div>
              <div style={{ maxWidth: "75%", padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px", background: msg.role === "user" ? "#2563eb" : "white", color: msg.role === "user" ? "white" : "var(--text)", fontSize: 14, lineHeight: 1.65, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: msg.role === "user" ? "none" : "1px solid var(--border)", whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="chat-bubble" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
              <Bot size={16} color="white" />
            </div>
            <div style={{ padding: "14px 18px", borderRadius: "4px 18px 18px 18px", background: "white", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", gap: 6, alignItems: "center" }}>
              {[0, 1, 2].map((j) => (
                <div key={j} className="typing-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#94a3b8" }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "white", flexShrink: 0 }}>
        <form onSubmit={sendMessage} style={{ display: "flex", gap: 10 }}>
          <input
            ref={inputRef}
            className="input"
            style={{ flex: 1, fontSize: 15 }}
            placeholder="Describe your symptoms or ask a health question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || historyLoading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || historyLoading || !input.trim()} style={{ padding: "0 18px", flexShrink: 0 }}>
            <Send size={16} />
          </button>
        </form>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
          For emergencies, call your local emergency number immediately.
        </p>
      </div>
    </div>
  );
}