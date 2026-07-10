export interface User {
  id: string | number;
  name: string;
  email: string;
  provider: string;
  avatar?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "";

export function loadUser(): User | null {
  try {
    const raw = localStorage.getItem("expense_tracker_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUser(user: User | null) {
  if (user) {
    localStorage.setItem("expense_tracker_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("expense_tracker_user");
  }
}

export async function loginWithSocial(provider: string, data: { name: string; email: string; avatar?: string }) {
  const res = await fetch(`${API_URL}/api/auth/social`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ provider, ...data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Login failed');
  saveUser(json.user);
  return json.user;
}

export async function registerUser(name: string, email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Registration failed');
  saveUser(json.user);
  return json.user;
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Login failed');
  saveUser(json.user);
  return json.user;
}

export async function fetchCurrentUser() {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.user) saveUser(json.user);
    return json.user;
  } catch {
    return null;
  }
}

export function getStorageKey(): string {
  const user = loadUser();
  return user ? `expense_tracker_data_${user.id}` : "expense_tracker_data_anon";
}

export function getIncomeStorageKey(): string {
  const user = loadUser();
  return user ? `expense_tracker_income_${user.id}` : "expense_tracker_income_anon";
}
