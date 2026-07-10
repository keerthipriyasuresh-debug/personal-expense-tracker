import { Expense } from "./types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function loadExpenses(): Promise<Expense[]> {
  try {
    const res = await fetch(`${API_URL}/api/expenses`, { credentials: 'include' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.expenses || [];
  } catch {
    return [];
  }
}

export async function addExpense(item: { title: string; amount: number; category: string; date: string; notes?: string }) {
  const res = await fetch(`${API_URL}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(item),
  });
  const data = await res.json();
  return data.expense;
}

export async function updateExpense(id: number | string, updates: Partial<{ title: string; amount: number; category: string; date: string; notes: string }>) {
  const res = await fetch(`${API_URL}/api/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  return data.expense;
}

export async function deleteExpense(id: string) {
  await fetch(`${API_URL}/api/expenses/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}
