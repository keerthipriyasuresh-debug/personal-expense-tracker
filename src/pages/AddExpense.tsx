import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../lib/types";
import { addExpense } from "../lib/store";
import { Check, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function AddExpense() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", amount: "", category: "Food", date: new Date().toISOString().slice(0, 10), notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return;
    setSaving(true);
    try {
      await addExpense({ title: form.title.trim(), amount, category: form.category, date: form.date, notes: form.notes.trim() });
      setSaving(false);
      setSubmitted(true);
      setTimeout(() => navigate("/"), 1200);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-serif italic tracking-tight mb-2">Add Expense</h1>
        <p className="text-ink-muted text-sm mb-8">Log your spending quickly and clearly.</p>
      </motion.div>
      <form onSubmit={handleSubmit} className="glass-card rounded-[28px] p-7 space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Expense Title</label>
          <input id="title" type="text" placeholder="Coffee, Rent, Taxi..." className="w-full h-11 px-4 rounded-2xl bg-white dark:bg-ink/30 border border-glass-stroke text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean/40 transition-all placeholder:text-ink-faint" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="amount" className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Amount</label>
            <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint text-sm">₹</span><input id="amount" type="number" min="0.01" step="0.01" placeholder="0.00" className="w-full h-11 pl-7 pr-4 rounded-2xl bg-white dark:bg-ink/30 border border-glass-stroke text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean/40 transition-all placeholder:text-ink-faint" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="date" className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Date</label>
            <input id="date" type="date" className="w-full h-11 px-4 rounded-2xl bg-white dark:bg-ink/30 border border-glass-stroke text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean/40 transition-all" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat.value} type="button" onClick={() => setForm({ ...form, category: cat.value })} className="h-11 rounded-2xl text-xs font-semibold border transition-all shadow-sm" style={{ borderColor: form.category === cat.value ? cat.color : "rgba(11,18,32,0.06)", backgroundColor: form.category === cat.value ? cat.glow : "transparent", color: form.category === cat.value ? cat.color : "var(--color-ink-muted)" }}>{cat.label}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Notes</label>
          <textarea id="notes" rows={3} placeholder="Any details..." className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-ink/30 border border-glass-stroke text-ink text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean/40 transition-all placeholder:text-ink-faint" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button type="submit" disabled={saving || submitted || !form.title.trim() || !form.amount} className="w-full h-12 rounded-2xl bg-gradient-to-r from-ocean to-ocean-deep text-white text-sm font-semibold shadow-lg shadow-ocean/20 hover:shadow-ocean/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2">
          {submitted ? <><Check className="w-4 h-4" /> Saved</> : saving ? <><Zap className="w-4 h-4 animate-pulse" /> Saving...</> : "Add Expense"}
        </button>
      </form>
      {submitted && <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-foliage font-medium mt-4 text-center">Expense saved successfully. Redirecting...</motion.p>}
    </div>
  );
}
