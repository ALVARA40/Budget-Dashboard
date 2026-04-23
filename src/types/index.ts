// ── Domain types ────────────────────────────────────────────────────────────

export type CategoryKind = 'income' | 'need' | 'want' | 'savings';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  kind: CategoryKind;
  monthly_budget: number;
}

export interface Bank {
  id: string;
  user_id: string;
  name: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
}

export type PaymentMethod = 'card' | 'transfer' | 'cash' | 'check' | 'other';

export interface Transaction {
  id: string;
  user_id: string;
  date: string;           // ISO date string
  amount: number;         // negative = expense, positive = income
  description: string;
  category_id: string | null;
  bank_id: string | null;
  company_id: string | null;
  method: PaymentMethod | null;
  created_at: string;
  // joined fields (from queries)
  category?: Category;
  bank?: Bank;
  company?: Company;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target: number;
  current: number;
  deadline: string | null;
  color: string;
}

// ── Dashboard data shapes ────────────────────────────────────────────────────

export interface KpiData {
  income:      { value: number; delta: number };
  expenses:    { value: number; delta: number };
  savings:     { value: number; delta: number };
  savingsRate: { value: number; delta: number };
}

export interface FlowMonth {
  m: string;
  income: number;
  expenses: number;
}

export interface SplitSegment {
  key: string;
  label: string;
  value: number;
  target: number;
  actual: number;
  color: string;
}

export interface BudgetItem {
  name: string;
  spent: number;
  budget: number;
  color: string;
}
