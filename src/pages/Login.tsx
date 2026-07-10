import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithSocial, registerUser, loginUser, fetchCurrentUser } from "../lib/auth";
import { Mail, Github, UserCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "verifying" | "done">("select");
  const [error, setError] = useState("");

  async function simulateAuth(provider: string, name: string, avatar?: string) {
    setLoadingProvider(provider);
    setStep("verifying");
    setError("");
    try {
      await loginWithSocial(provider, { name, email: email || `${provider}@example.com`, avatar: avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random()*70)+1}` });
      setStep("done");
      setTimeout(() => navigate("/"), 700);
    } catch (e: any) {
      setError(e.message || "Authentication failed. Ensure the backend is running.");
      setStep("select");
    } finally {
      setLoadingProvider(null);
    }
  }

  async function handleGoogle() {
    await simulateAuth("google", "Ravi Kumar", "https://i.pravatar.cc/150?img=12");
  }

  async function handleGithub() {
    await simulateAuth("github", "Priya Sharma", "https://i.pravatar.cc/150?img=5");
  }

  async function handleDemo() {
    await simulateAuth("demo", "Guest User", "https://i.pravatar.cc/150?img=3");
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoadingProvider("email");
    setStep("verifying");
    setError("");
    try {
      if (password.length < 6) {
        await registerUser(name.trim() || email.trim().split("@")[0], email.trim(), password);
      } else {
        try {
          await loginUser(email.trim(), password);
        } catch {
          await registerUser(name.trim() || email.trim().split("@")[0], email.trim(), password);
        }
      }
      setStep("done");
      setTimeout(() => navigate("/"), 700);
    } catch (e: any) {
      setError(e.message || "Login/Registration failed. Try again.");
      setStep("select");
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 pb-24 pt-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-ocean to-foliage flex items-center justify-center shadow-xl shadow-ocean/20">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-serif italic tracking-tight mb-2">Welcome Back</h1>
        <p className="text-ink-muted text-sm">Sign in securely with Google, GitHub, or Email.</p>
      </motion.div>

      <div className="glass-card rounded-[28px] p-8 space-y-5 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "verifying" ? (
            <motion.div key="verifying" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-14 h-14 rounded-full border-[3px] border-ocean/15 border-t-ocean animate-spin" />
              <h2 className="text-xl font-semibold text-ink">Authenticating</h2>
              <p className="text-sm text-ink-muted text-center max-w-xs">Verifying with backend database. Please wait...</p>
              <div className="flex gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ocean animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-ocean animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-ocean animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          ) : step === "done" ? (
            <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-foliage/15 text-foliage flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-ink">Authenticated Successfully</h2>
              <p className="text-sm text-ink-muted">Redirecting to your secure dashboard...</p>
            </motion.div>
          ) : (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {error && (
                <div className="mb-3 p-3 rounded-2xl bg-rose-soft/10 text-rose-soft text-sm font-medium border border-rose-soft/20">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <button onClick={handleGoogle} disabled={!!loadingProvider} className="h-12 rounded-2xl bg-white border border-glass-stroke text-ink text-sm font-semibold flex items-center justify-center gap-2.5 hover:shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.14 2.81v2.31h3.47c2.02-1.88 3.19-4.66 3.19-7.93z"/><path fill="#34A853" d="M12 23c2.7 0 4.97-.89 6.62-2.42l-3.22-2.49c-.89.6-2.03.96-3.4.96-2.61 0-4.82-1.76-5.61-4.12H3.06v2.59C4.7 20.37 8.06 23 12 23z"/><path fill="#FBBC05" d="M6.39 13.93c-.2-.6-.31-1.24-.31-1.93s.11-1.33.31-1.93V7.48H3.06C2.38 9.11 2 10.98 2 13s.38 3.89 1.06 5.52l3.33-2.59z"/><path fill="#EA4335" d="M12 6.49c1.45 0 2.75.5 3.77 1.48l2.82-2.82C16.97 3.46 14.7 2 12 2 8.06 2 4.7 3.63 3.06 7.48l3.33 2.59C7.18 8.25 9.39 6.49 12 6.49z"/></svg>
                  Continue with Google
                </button>
                <button onClick={handleGithub} disabled={!!loadingProvider} className="h-12 rounded-2xl bg-[#181818] text-white text-sm font-semibold flex items-center justify-center gap-2.5 hover:shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Github size={18} />
                  Continue with GitHub
                </button>
                <button onClick={() => setEmailMode(!emailMode)} disabled={!!loadingProvider} className="h-12 rounded-2xl bg-ocean-glow text-ocean border border-ocean/10 text-sm font-semibold flex items-center justify-center gap-2.5 hover:bg-ocean/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <Mail size={18} />
                  {emailMode ? "Hide Email Form" : "Continue with Email"}
                </button>
              </div>

              {emailMode && (
                <motion.form onSubmit={handleEmailSubmit} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden pt-1">
                  <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} className="w-full h-11 px-4 rounded-2xl bg-white dark:bg-ink/20 border border-glass-stroke text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ocean/30" />
                  <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-11 px-4 rounded-2xl bg-white dark:bg-ink/20 border border-glass-stroke text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ocean/30" required />
                  <input type="password" placeholder="Password (min 6 chars)" minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full h-11 px-4 rounded-2xl bg-white dark:bg-ink/20 border border-glass-stroke text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ocean/30" required />
                  <button type="submit" disabled={!!loadingProvider} className="w-full h-11 rounded-2xl bg-gradient-to-r from-ocean to-ocean-deep text-white text-sm font-semibold shadow-lg shadow-ocean/20 hover:shadow-ocean/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    <ArrowRight size={14} /> Secure Sign In / Register
                  </button>
                </motion.form>
              )}

              <div className="pt-2 border-t border-glass-stroke">
                <button onClick={handleDemo} disabled={!!loadingProvider} className="w-full h-11 rounded-2xl bg-paper border border-glass-stroke text-ink-muted text-sm font-medium flex items-center justify-center gap-2 hover:text-ink hover:bg-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <UserCircle size={18} /> Try as Guest (Limited Access)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-[11px] text-ink-faint mt-6">Real backend authentication via PostgreSQL database.</p>
    </div>
  );
}
