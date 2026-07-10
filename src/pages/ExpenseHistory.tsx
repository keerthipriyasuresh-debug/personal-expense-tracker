import { useState, useMemo, useEffect } from "react";
import { Expense, CATEGORIES, formatRupees } from "../lib/types";
import { loadExpenses, updateExpense, deleteExpense } from "../lib/store";
import { Search, Trash2, Pencil, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ExpenseHistory() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const list = await loadExpenses();
      setExpenses(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch = e.title?.toLowerCase().includes(search.toLowerCase()) || e.notes?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === "All" || e.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, filterCategory]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      await refresh();
      setMessage("Expense deleted.");
      setTimeout(() => setMessage(""), 2000);
    } catch {}
  }

  function startEdit(e: Expense) {
    setEditingId(e.id);
    setEditForm({ title: e.title, amount: e.amount, category: e.category, date: e.date, notes: e.notes });
  }

  function cancelEdit() { setEditingId(null); setEditForm({}); }

  async function saveEdit() {
    if (!editingId) return;
    const rawAmount = editForm.amount === undefined ? 0 : (typeof editForm.amount === "number" ? editForm.amount : parseFloat(String(editForm.amount) || "0"));
    try {
      await updateExpense(editingId, {
        title: editForm.title || "",
        amount: isNaN(rawAmount) ? 0 : rawAmount,
        category: (editForm.category as string) || "Others",
        date: (editForm.date as string) || new Date().toISOString().slice(0, 10),
        notes: editForm.notes || "",
      });
      await refresh();
      setMessage("Expense updated.");
      setTimeout(() => setMessage(""), 2000);
    } catch {}
    setEditingId(null);
    setEditForm({});
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pb-24">
      <h1 className="text-3xl font-serif italic tracking-tight mb-2">Expense History</h1>
      <p className="text-ink-muted text-sm mb-8">Browse, search, filter, and manage all your records.</p>

      <div className="glass-card rounded-[24px] p-6">
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input type="text" placeholder="Search title or notes..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-2xl bg-white dark:bg-ink/30 border border-glass-stroke text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean/40 transition-all placeholder:text-ink-faint" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button onClick={() => setFilterCategory("All")} className={`h-10 px-4 rounded-2xl text-xs font-semibold border transition-all shadow-sm whitespace-nowrap ${filterCategory === "All" ? "bg-ink text-white border-ink shadow-ink/10" : "bg-white/60 dark:bg-ink/20 text-ink-muted border-glass-stroke hover:text-ink"}`}>All</button>
            {CATEGORIES.map(cat => <button key={cat.value} onClick={() => setFilterCategory(cat.value)} className={`h-10 px-4 rounded-2xl text-xs font-semibold border transition-all shadow-sm whitespace-nowrap ${filterCategory === cat.value ? "text-white shadow-sm" : "bg-white/60 dark:bg-ink/20 text-ink-muted border-glass-stroke hover:text-ink"}`} style={filterCategory === cat.value ? { backgroundColor: cat.color, borderColor: cat.color } : {}}>{cat.label}</button>)}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-sm">
            <thead><tr className="text-[11px] uppercase tracking-widest text-ink-faint border-b border-glass-stroke"><th className="text-left py-3 px-3 font-semibold">Date</th><th className="text-left py-3 px-3 font-semibold">Title</th><th className="text-left py-3 px-3 font-semibold">Category</th><th className="text-right py-3 px-3 font-semibold">Amount</th><th className="text-right py-3 px-3 font-semibold">Actions</th></tr></thead>
            <tbody className="divide-y divide-glass-stroke">
              {loading ? <tr><td colSpan={5} className="py-8 text-center text-ink-faint text-sm">Loading...</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-ink-faint text-sm">No records found.</td></tr> : filtered.map(e => (
                <tr key={e.id} className="hover:bg-ink/[0.012] transition-colors">
                  <td className="py-3 px-3 whitespace-nowrap text-ink-muted text-xs">{new Date(e.date || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="py-3 px-3">{editingId === String(e.id) ? <input className="w-full h-8 px-2 rounded-lg bg-white dark:bg-ink/30 border border-glass-stroke text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ocean/30" value={editForm.title || ""} onChange={ev => setEditForm({ ...editForm, title: ev.target.value })} /> : <div className="font-medium text-ink truncate max-w-[160px] sm:max-w-xs">{e.title}</div>}</td>
                  <td className="py-3 px-3">{editingId === String(e.id) ? <select className="h-8 px-2 rounded-lg bg-white dark:bg-ink/30 border border-glass-stroke text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ocean/30" value={editForm.category || e.category} onChange={ev => setEditForm({ ...editForm, category: ev.target.value })}>{CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select> : <span className="inline-block text-[11px] px-2 py-0.5 rounded-md font-medium text-white" style={{ backgroundColor: CATEGORIES.find(c => c.value === e.category)?.color || "#6B7280" }}>{e.category}</span>}</td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">{editingId === String(e.id) ? <input type="number" min="0.01" step="0.01" className="w-24 h-8 px-2 rounded-lg bg-white dark:bg-ink/30 border border-glass-stroke text-sm text-ink text-right focus:outline-none focus:ring-2 focus:ring-ocean/30" value={editForm.amount || ""} onChange={ev => setEditForm({ ...editForm, amount: parseFloat(ev.target.value) || 0 })} /> : <span className="font-semibold text-ink tracking-tight">-{formatRupees(e.amount)}</span>}</td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">{editingId === String(e.id) ? <div className="flex items-center justify-end gap-1.5"><button onClick={saveEdit} className="w-7 h-7 rounded-lg bg-foliage/10 text-foliage flex items-center justify-center hover:bg-foliage/20" aria-label="Save"><Check className="w-3.5 h-3.5" /></button><button onClick={cancelEdit} className="w-7 h-7 rounded-lg bg-rose-soft/10 text-rose-soft flex items-center justify-center hover:bg-rose-soft/20" aria-label="Cancel"><X className="w-3.5 h-3.5" /></button></div> : <div className="flex items-center justify-end gap-1.5"><button onClick={() => startEdit(e)} className="w-7 h-7 rounded-lg bg-ocean/10 text-ocean flex items-center justify-center hover:bg-ocean/20" aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(String(e.id))} className="w-7 h-7 rounded-lg bg-rose-soft/10 text-rose-soft flex items-center justify-center hover:bg-rose-soft/20" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button></div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AnimatePresence>{message && <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-sm text-ocean font-medium mt-3">{message}</motion.p>}</AnimatePresence>
      </div>
    </div>
  );
}
