import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AddEntryModal } from './components/ui/AddEntryModal';
import { Dashboard } from './pages/Dashboard';
import { BudgetPlanning } from './pages/BudgetPlanning';
import { BudgetTracking } from './pages/BudgetTracking';
import { Split5030 } from './pages/Split5030';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import type { Session } from '@supabase/supabase-js';

function AppShell({ session }: { session: Session | null }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setYear]   = useState(2026);
  const [selectedMonth, setMonth] = useState(4);

  async function handleSaveEntry(entry: {
    date: string; description: string; amount: number;
    categoryName: string; kind: string; method: string;
  }) {
    if (!session) return;
    // 1. Upsert category
    let categoryId: string | null = null;
    const { data: cats } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('name', entry.categoryName)
      .limit(1);
    if (cats && cats.length > 0) {
      categoryId = cats[0].id;
    } else {
      const { data: newCat } = await supabase
        .from('categories')
        .insert({ user_id: session.user.id, name: entry.categoryName, kind: entry.kind, color: '#7C5CFC', monthly_budget: 0 })
        .select('id')
        .single();
      if (newCat) categoryId = newCat.id;
    }
    // 2. Insert transaction
    await supabase.from('transactions').insert({
      user_id: session.user.id,
      date: entry.date,
      amount: entry.amount,
      description: entry.description,
      category_id: categoryId,
      method: entry.method,
    });
    setShowModal(false);
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Header
          onAddEntry={() => setShowModal(true)}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
        <div className="page-content">
          <Routes>
            <Route path="/"                element={<Dashboard />} />
            <Route path="/budget-planning" element={<BudgetPlanning />} />
            <Route path="/budget-tracking" element={<BudgetTracking />} />
            <Route path="/50-30-20"        element={<Split5030 />} />
            <Route path="/analytics"       element={<Analytics />} />
            <Route path="/settings"        element={<Settings />} />
            <Route path="*"                element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      {showModal && (
        <AddEntryModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveEntry}
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

  // Still loading
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
