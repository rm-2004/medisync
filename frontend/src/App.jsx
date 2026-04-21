import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useCallback, createContext, useContext } from "react";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Medications from "./pages/Medications.jsx";
import Symptoms from "./pages/Symptoms.jsx";
import Reminders from "./pages/Reminders.jsx";
import Caretakers from "./pages/Caretakers.jsx";
import Reports from "./pages/Reports.jsx";
import Consult from "./pages/Consult.jsx";

const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}

function getStoredUser() {
  const id = localStorage.getItem("medisync_user_id");
  const name = localStorage.getItem("medisync_user_name");
  const uniqueId = localStorage.getItem("medisync_unique_id");
  if (id && name) return { _id: id, name, uniqueId };
  return null;
}

export default function App() {
  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(getStoredUser);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  function handleLogin(userData) {
    setUser(userData);
  }

  function handleLogout() {
    localStorage.removeItem("medisync_user_id");
    localStorage.removeItem("medisync_user_name");
    localStorage.removeItem("medisync_unique_id");
    setUser(null);
  }

  if (!user) {
    return (
      <ToastContext.Provider value={addToast}>
        <Landing onLogin={handleLogin} />
        <ToastContainer toasts={toasts} />
      </ToastContext.Provider>
    );
  }

  return (
    <ToastContext.Provider value={addToast}>
      <BrowserRouter>
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/medications" element={<Medications />} />
            <Route path="/symptoms" element={<Symptoms />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/caretakers" element={<Caretakers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/consult" element={<Consult />} />
          </Routes>
        </Layout>
        <ToastContainer toasts={toasts} />
      </BrowserRouter>
    </ToastContext.Provider>
  );
}