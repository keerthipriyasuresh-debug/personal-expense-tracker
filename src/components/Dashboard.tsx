import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Wallet, Clock, TrendingUp, Edit3, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Expense, CATEGORIES, formatRupees } from "../lib/types";
import { loadExpenses } from "../lib/store";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState(0);
  const [incomeEdit, setIncomeEdit] = useState(false);
  const [incomeInput, setIncomeInput] = useState("0");
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const [expRes, incRes] = await Promise.all([
        fetch(`${API_URL}/api/expenses`, { credentials: 'include' }),
        fetch(`${API_URL}/api/income`, { credentials: 'include' }),
      ]);
      if (expRes.ok) {
        const data = await expRes.json();
        setExpenses(data.expenses || []);
      }
      if (incRes.ok) {
        const data = await incRes.json();
        setIncome(data.amount || 0);
        setIncomeInput((data.amount || 0).toString());
      }
    } catch {
      setExpenses([]);
      setIncome(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  async function saveIncomeValue() {
    const val = parseFloat(incomeInput);
    if (!isNaN(val) && val >= 0) {
      try {
        await fetch(`${API_URL}/api/income`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ amount: val }),
        });
        setIncome(val);
      } catch {}
    }
    setIncomeEdit(false);
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const balance = Math.max(0, income - totalExpenses);
  const recent = [...expenses].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5);

  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + (e.amount || 0);
  });

  return (
    <div className="max-w-6xl mx-auto px-6 pb-20 space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="glass-card rounded-[24px] p-7 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-40 bg-ocean-glow" />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-ocean-glow text-ocean flex items-center justify-center shadow-sm">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-ink-muted tracking-tight">Total Income</span>
              <button onClick={() => { setIncomeEdit(!incomeEdit); setIncomeInput(income.toString()); }} className="ml-2 text-[10px] text-ink-faint hover:text-ocean transition-colors inline-flex items-center gap-0.5" aria-label="Edit income">
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>
          {incomeEdit ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-ocean">₹</span>
              <input type="number" min="0" step="100" value={incomeInput} onChange={e => setIncomeInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveIncomeValue(); if (e.key === "Escape") setIncomeEdit(false); }} className="w-32 h-9 px-2 rounded-xl bg-white dark:bg-ink/20 border border-glass-stroke text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-ocean/30" autoFocus />
              <button onClick={saveIncomeValue} className="w-7 h-7 rounded-lg bg-foliage/10 text-foliage flex items-center justify-center hover:bg-foliage/20" aria-label="Save"><Check className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <h3 className="text-3xl font-semibold tracking-tight text-ink leading-none">{formatRupees(income)}</h3>
          )}
          <div className="h-0.5 w-12 rounded-full bg-gradient-to-r from-ocean to-foliage mt-4" />
        </motion.article>

        <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-card rounded-[24px] p-7 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-40 bg-rose-glow" />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-rose-glow text-rose-soft flex items-center justify-center shadow-sm"><ArrowDownRight className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-ink-muted tracking-tight">Total Expenses</span>
          </div>
          <h3 className="text-3xl font-semibold tracking-tight text-ink leading-none mb-1">{formatRupees(totalExpenses)}</h3>
          <div className="h-0.5 w-12 rounded-full bg-gradient-to-r from-rose-soft to-amber mt-4" />
        </motion.article>

        <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="glass-card rounded-[24px] p-7 relative overflow-hidden group">
          <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-40 ${balance >= 0 ? "bg-foliage-glow" : "bg-rose-glow"}`} />
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${balance >= 0 ? "bg-foliage-glow text-foliage" : "bg-rose-glow text-rose-soft"}`}><Wallet className="w-5 h-5" /></div>
            <span className="text-sm font-medium text-ink-muted tracking-tight">Remaining Balance</span>
          </div>
          <h3 className={`text-3xl font-semibold tracking-tight leading-none mb-1 ${balance >= 0 ? "text-ink" : "text-rose-soft"}`}>{formatRupees(balance)}</h3>
          <div className="h-0.5 w-12 rounded-full bg-gradient-to-r from-ocean to-foliage mt-4" />
        </motion.article>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent */}
        <section className="lg:col-span-3 glass-card rounded-[24px] p-7">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-ink/5 flex items-center justify-center"><Clock className="w-4 h-4 text-ink-muted" /></div>
            <h2 className="text-lg font-semibold tracking-tight">Recent Transactions</h2>
          </div>
          {loading ? <div className="text-sm text-ink-faint">Loading...</div> : recent.length === 0 ? <div className="text-sm text-ink-faint">No expenses recorded yet.</div> : (
            <div className="flex flex-col divide-y divide-glass-stroke">
              {recent.map((e) => (
                <Link to="/history" key={e.id} className="group flex items-center gap-4 py-3.5 hover:bg-ink/[0.015] -mx-2 px-2 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0" style={{ backgroundColor: CATEGORIES.find(c => c.value === e.category)?.color || "#6B7280" }}>{e.title?.charAt(0).toUpperCase() || "?"}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium truncate text-ink group-hover:text-ocean transition-colors">{e.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-ink/[0.04] text-ink-muted">{e.category}</span>
                      <span className="text-[11px] text-ink-faint">{new Date(e.date || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ink tracking-tight shrink-0">-{formatRupees(e.amount)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Category Pie */}
        <section className="lg:col-span-2 glass-card rounded-[24px] p-7">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-ink/5 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-ink-muted" /></div>
            <h2 className="text-lg font-semibold tracking-tight">Spending by Category</h2>
          </div>
          {Object.keys(byCategory).length === 0 ? <div className="text-sm text-ink-faint">No data yet.</div> : (
            <div className="flex flex-col gap-3">
              <div className="relative h-48 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-44 h-44 drop-shadow-lg rotate-[-90deg]">
                  {(() => { let offset = 0; const total = Object.values(byCategory).reduce((a,b)=>a+b,0); return Object.entries(byCategory).map(([cat,val]) => { const pct = val/total; const r=80; const cx=100,cy=100; const angle=pct*2*Math.PI; const x1=cx+r*Math.cos(offset); const y1=cy+r*Math.sin(offset); const x2=cx+r*Math.cos(offset+angle); const y2=cy+r*Math.sin(offset+angle); const largeArc = angle > Math.PI ? 1 : 0; const d=`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`; const color = CATEGORIES.find(c=>c.value===cat)?.color||"#6B7280"; offset+=angle; return <path key={cat} d={d} fill={color} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />; }); })()}
                  <circle cx="100" cy="100" r="48" fill="white" />
                </svg>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([cat,val]) => {
                  const color = CATEGORIES.find(c=>c.value===cat)?.color||"#6B7280"; const total = Object.values(byCategory).reduce((a,b)=>a+b,0);
                  return <Link to="/reports" key={cat} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-glass-stroke hover:shadow-sm transition-shadow"><span className="w-2 h-2 rounded-full shadow-inner" style={{backgroundColor:color}} /><span className="text-ink-muted">{cat}</span><span className="text-ink font-semibold">{Math.round((val/total)*100)}%</span></Link>;
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
