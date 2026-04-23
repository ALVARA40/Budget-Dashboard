import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function AppShell() {
  const [showModal, setShowModal]     = useState(false);
  const [selectedYear, setYear]       = useState(2026);
  const [selectedMonth, setMonth]     = useState(4);  // April

  function handleSaveEntry(entry: {
    date: string; description: string; amount: number;
    categoryName: string; kind: string; method: string;
  }) {
    // TODO: persist to Supabase when connected
    console.log('New entry:', entry);
    // For now, just log it — Supabase integration adds the DB write here
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
            <Route path="*"               element={<Navigate to="/" replace />} />
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
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*"     element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  );
}
