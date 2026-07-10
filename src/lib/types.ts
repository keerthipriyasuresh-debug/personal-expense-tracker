export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  notes: string;
}

export const CATEGORIES = [
  { label: "Food", value: "Food", color: "#2A9D6A", glow: "#E8F6F0" },
  { label: "Transport", value: "Transport", color: "#1B6B93", glow: "#EAF3F8" },
  { label: "Shopping", value: "Shopping", color: "#C88A2C", glow: "#FBF3E6" },
  { label: "Bills", value: "Bills", color: "#D45D6A", glow: "#FBEDEE" },
  { label: "Entertainment", value: "Entertainment", color: "#7C3AED", glow: "#F0EBFA" },
  { label: "Others", value: "Others", color: "#6B7280", glow: "#F3F4F6" },
];

export function getCategoryColor(category: string) {
  const c = CATEGORIES.find((x) => x.value === category);
  return c ? c.color : "#6B7280";
}

export function getCategoryGlow(category: string) {
  const c = CATEGORIES.find((x) => x.value === category);
  return c ? c.glow : "#F3F4F6";
}

export function formatRupees(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}
