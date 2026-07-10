import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import AddExpense from "./pages/AddExpense";
import ExpenseHistory from "./pages/ExpenseHistory";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import { loadUser } from "./lib/auth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = loadUser();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      try { localStorage.setItem("theme", "dark"); } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try { localStorage.setItem("theme", "light"); } catch {}
    }
  }, [dark]);

  return (
    <BrowserRouter>
      <div className={`min-h-screen transition-colors duration-500 ${dark ? "dark" : ""}`}>
        <Navbar dark={dark} toggleDark={() => setDark(!dark)} />
        <main className="pt-6">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/add" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><ExpenseHistory /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          </Routes>
        </main>

        <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-glass-stroke/40">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-ink-faint text-xs">
            <span className="font-serif italic">Personal Expense Tracker</span>
            <span>Built with clean design, glassmorphism, and local storage.</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
