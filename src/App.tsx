import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AddEntryModal } from './components/ui/AddEntryModal';
import { Dashboard } from './pages/Dashboard';
import { BudgetPlanning } from './pages/BudgetPlanning';
import { BudgetTracking } from './pages/BudgetTracking';
import { BudgetVsTracked } from './pages/BudgetVsTracked';
import { Split5030 } from './pages/Split5030';
import { Payments } from './pages/Payments';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import type { Session } from '@supabase/supabase-js';

interface AppCategory {
  id: string;
  name: string;
  kind: 'income' | 'need' | 'want' | 'savings';
  color: string;
}

export interface GlobalFilters {
  category: string;
  bank: string;
  company: string;
  search: string;
}

function AppShell({ session }: { session: Session | null }) {
  const [showModal, setShowModal]   = useState(false);
  const [selectedYear, setYear]     = useState(2026);
  const [selectedMonth, setMonth]   = useState(4);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [banks, setBanks]           = useState<string[]>([]);
  const [companies, setCompanies]   = useState<string[]>([]);
  const [filters, setFilters]       = useState<GlobalFilters>({ category: 'All', bank: 'All', company: 'All', search: '' });

  useEffect(() => {
    if (!session) return;
    const uid = session.user.id;
    supabase.from('categories').select('id, name, kind, color').eq('user_id', uid).order('name')
      .then(({ data }) => { if (data) setCategories(data as AppCategory[]); });
    supabase.from('banks').select('name').eq('user_id', uid).order('name')
      .then(({ data }) => { if (data) setBanks(data.map((b: any) => b.name)); });
    supabase.from('companies').select('name').eq('user_id', uid).order('name')
      .then(({ data }) => { if (data) setCompanies(data.map((c: any) => c.name)); });
  }, [session]);

  async function handleSaveEntry(entry: {
    date: string; description: string; amount: number;
    categoryName: string; kind: string; method: string;
  }) {
    if (!session) return;
    let categoryId: string | null = null;
    const existing = categories.find(c => c.name === entry.categoryName);
    if (existing) {
      categoryId = existing.id;
    } else {
      const { data: newCat } = await supabase
        .from('categories')
        .insert({ user_id: session.user.id, name: entry.categoryName, kind: entry.kind, color: '#7C5CFC', monthly_budget: 0 })
        .select('id, name, kind, color').single();
      if (newCat) {
        categoryId = newCat.id;
        setCategories(prev => [...prev, newCat as AppCategory].sort((a, b) => a.name.localeCompare(b.name)));
      }
    }
    const { error } = await supabase.from('transactions').insert({
      user_id: session.user.id, date: entry.date, amount: entry.amount,
      description: entry.description, category_id: categoryId, method: entry.method,
    });
    if (!error) {
      setShowModal(false);
      setRefreshKey(k => k + 1);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Header
          onAddEntry={() => setShowModal(true)}
          selectedYear={selectedYear} selectedMonth={selectedMonth}
          onYearChange={setYear} onMonthChange={setMonth}
          categoryOptions={categories.map(c => c.name)}
          bankOptions={banks}
          companyOptions={companies}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <div className="page-content">
          <Routes>
            <Route path="/"                   element={<Dashboard       year={selectedYear} month={selectedMonth} refreshKey={refreshKey} filters={filters} />} />
            <Route path="/budget-planning"    element={<BudgetPlanning  year={selectedYear} month={selectedMonth} />} />
            <Route path="/budget-tracking"    element={<BudgetTracking  year={selectedYear} month={selectedMonth} refreshKey={refreshKey} filters={filters} />} />
            <Route path="/budget-vs-tracked"  element={<BudgetVsTracked year={selectedYear} month={selectedMonth} refreshKey={refreshKey} />} />
            <Route path="/payments"           element={<Payments        year={selectedYear} month={selectedMonth} refreshKey={refreshKey} filters={filters} />} />
            <Route path="/50-30-20"           element={<Split5030       year={selectedYear} month={selectedMonth} refreshKey={refreshKey} filters={filters} />} />
            <Route path="/settings"           element={<Settings />} />
            <Route path="*"                   element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      {showModal && (
        <AddEntryModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveEntry}
          categories={categories}
        />
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Loading…</div>
      </div>
    );
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/*"     element={<AppShell session={session} />} />
      </Routes>
    </BrowserRouter>
  );
}
