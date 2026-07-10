import { getIncomeStorageKey } from "./auth";

export function loadIncome(): number {
  try {
    const raw = localStorage.getItem(getIncomeStorageKey());
    if (!raw) return 0;
    const val = parseFloat(raw);
    return isNaN(val) ? 0 : val;
  } catch {
    return 0;
  }
}

export function saveIncome(amount: number) {
  localStorage.setItem(getIncomeStorageKey(), amount.toString());
}
