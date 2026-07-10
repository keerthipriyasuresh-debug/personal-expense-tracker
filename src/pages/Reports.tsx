import { useMemo, useState, useEffect } from "react";
import { Expense, CATEGORIES, formatRupees } from "../lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, PieChart as PieIcon } from "lucide-react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Reports() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}/api/expenses`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setExpenses(data.expenses || []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const monthly: Record<string, number> = {};
  expenses.forEach((e) => {
    const month = (e.date || '').slice(0, 7);
    if (month) monthly[month] = (monthly[month] || 0) + (e.amount || 0);
  });
  const monthlyData = Object.entries(monthly).sort().map(([month, total]) => ({ month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }), total }));

  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + (e.amount || 0); });
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-5xl mx-auto px-6 pb-24 space-y-8">
      <div><h1 className="text-3xl font-serif italic tracking-tight mb-2">Reports</h1><p className="text-ink-muted text-sm">Visual summaries of your spending patterns.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="glass-card rounded-[24px] p-6 lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-5"><div className="w-8 h-8 rounded-xl bg-ocean-glow text-ocean flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div><h2 className="text-lg font-semibold tracking-tight">Monthly Spending</h2></div>
          <div className="h-72">
            {loading ? <div className="h-full flex items-center justify-center text-ink-faint text-sm">Loading data...</div> : monthlyData.length === 0 ? <div className="h-full flex items-center justify-center text-ink-faint text-sm">No data yet.</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barCategoryGap="20%">
                  <XAxis dataKey="month" tick={{ fill: "#50607A", fontSize: 12 }} axisLine={{ stroke: "rgba(11,18,32,0.08)" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8898AD", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₹${v}`} />
                  <Tooltip cursor={{ fill: "rgba(11,18,32,0.03)" }} contentStyle={{ border: "none", borderRadius: "16px", boxShadow: "0 12px 40px rgba(11,18,32,0.08)", backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.85)" }} labelStyle={{ color: "#0B1220", fontWeight: 600 }} formatter={(v: unknown) => [`${formatRupees(typeof v === "number" ? v : 0)}`, "Spent"]} />
                  <Bar dataKey="total" radius={[12, 12, 12, 12]} fill="#1B6B93" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="glass-card rounded-[24px] p-6">
          <div className="flex items-center gap-2.5 mb-5"><div className="w-8 h-8 rounded-xl bg-foliage-glow text-foliage flex items-center justify-center"><PieIcon className="w-4 h-4" /></div><h2 className="text-lg font-semibold tracking-tight">By Category</h2></div>
          <div className="h-64">
            {loading ? <div className="h-full flex items-center justify-center text-ink-faint text-sm">Loading...</div> : pieData.length === 0 ? <div className="h-full flex items-center justify-center text-ink-faint text-sm">No data yet.</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="42%" innerRadius={52} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((entry) => { const cat = CATEGORIES.find(c => c.value === entry.name); return <Cell key={entry.name} fill={cat ? cat.color : "#6B7280"} />; })}
                  </Pie>
                  <Legend verticalAlign="bottom" align="center" iconType="circle" formatter={(value: string) => <span className="text-xs text-ink-muted ml-1">{value}</span>} />
                  <Tooltip formatter={(v: unknown) => [`${formatRupees(typeof v === "number" ? v : 0)}`, "Total"]} contentStyle={{ border: "none", borderRadius: "16px", boxShadow: "0 12px 40px rgba(11,18,32,0.08)", backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.85)" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="glass-card rounded-[24px] p-6">
          <h2 className="text-lg font-semibold tracking-tight mb-5">Quick Summary</h2>
          <div className="flex flex-col gap-3">
            {CATEGORIES.map(cat => { const total = byCategory[cat.value] || 0; const allTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0); const pct = allTotal ? Math.round((total / allTotal) * 100) : 0; return (
              <Link to="/history" key={cat.value} className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-ink/[0.015] transition-colors">
                <span className="w-3 h-3 rounded-full shadow-inner shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-sm font-medium text-ink flex-1">{cat.label}</span>
                <span className="text-xs text-ink-faint">{pct}%</span>
                <span className="text-sm font-semibold text-ink tracking-tight">{formatRupees(total)}</span>
              </Link>
            ); })}
          </div>
        </section>
      </div>
    </div>
  );
}
