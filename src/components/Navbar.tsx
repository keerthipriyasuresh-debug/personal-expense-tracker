import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon, Wallet, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loadUser, saveUser, fetchCurrentUser } from "../lib/auth";

export default function Navbar({ dark, toggleDark }: { dark: boolean; toggleDark: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const current = await fetchCurrentUser();
      if (current) setUser(current);
      else setUser(null);
    }
    load();
  }, []);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorage = () => setUser(loadUser());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const links = [
    { label: "Dashboard", to: "/" },
    { label: "Add Expense", to: "/add" },
    { label: "Expense History", to: "/history" },
    { label: "Reports", to: "/reports" },
  ];

  function handleLogout() {
    saveUser(null);
    setUser(null);
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-50 glass-card">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ocean to-foliage flex items-center justify-center shadow-lg shadow-ocean/20 group-hover:shadow-ocean/40 transition-shadow">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-serif italic font-normal tracking-tight text-ink leading-none hidden sm:block">Personal Expense Tracker</span>
        </Link>

        {user ? (
          <nav className="hidden md:flex items-center gap-1 bg-white/50 dark:bg-ink/20 rounded-full px-1.5 py-1 backdrop-blur-md border border-glass-stroke">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  location.pathname === l.to ? "bg-ink text-white shadow-md shadow-ink/10" : "text-ink-muted hover:text-ink hover:bg-white/60"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        ) : (
          <div className="hidden md:block">
            <Link to="/login" className="px-5 py-2 rounded-full bg-gradient-to-r from-ocean to-ocean-deep text-white text-sm font-semibold shadow-lg shadow-ocean/20 hover:shadow-ocean/40 transition-all">Login</Link>
          </div>
        )}

        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-ink/10 border border-glass-stroke text-xs font-medium text-ink-muted">
              <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.email}`} alt={user.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-ink/10" />
              <span className="truncate max-w-[120px]">{user.name}</span>
            </div>
          )}
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-ink/5 transition-colors text-ink-muted hover:text-ink"
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={dark ? "moon" : "sun"}
                initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2 }}
              >
                {dark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </motion.div>
            </AnimatePresence>
          </button>
          {user && (
            <button onClick={handleLogout} aria-label="Logout" title="Logout" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-soft/10 text-ink-muted hover:text-rose-soft transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
          <button
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-ink/5 transition-colors text-ink-muted hover:text-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-glass-stroke bg-surface-glass backdrop-blur-xl"
          >
            <nav className="flex flex-col px-6 py-4 gap-1">
              {user ? (
                <>
                  {links.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                        location.pathname === l.to ? "bg-ink text-white shadow-lg shadow-ink/10" : "text-ink-muted hover:text-ink hover:bg-ink/5"
                      }`}
                    >
                      {l.label}
                    </Link>
                  ))}
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-left px-4 py-3 rounded-2xl text-sm font-medium text-rose-soft hover:bg-rose-glow transition-colors flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-2xl text-sm font-medium bg-gradient-to-r from-ocean to-ocean-deep text-white shadow-lg shadow-ocean/10">Login</Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
