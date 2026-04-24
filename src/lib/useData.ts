// Hook that fetches real data from Supabase for the current month/year.
// Falls back to static data if not authenticated.
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import {
  STATIC_KPI, STATIC_FLOW, STATIC_SPLIT, STATIC_BUDGET, STATIC_TRANSACTIONS,
} from './staticData';
import type { KpiData, FlowMonth, SplitSegment, BudgetItem, Transaction } from '../types/index';

export interface DashboardData {
  kpi:          KpiData;
  flow:         FlowMonth[];
  split:        SplitSegment[];
  budget:       BudgetItem[];
  transactions: Transaction[];
  loading:      boolean;
}

export function useDashboardData(year: number, month: number): DashboardData {
  const [data, setData] = useState<DashboardData>({
    kpi: STATIC_KPI, flow: STATIC_FLOW, split: STATIC_SPLIT,
    budget: STATIC_BUDGET, transactions: STATIC_TRANSACTIONS, loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setData(d => ({ ...d, loading: false }));
        return;
      }

      // Date range for selected month
      const from = `${year}-${String(month).padStart(2,'0')}-01`;
      const to   = new Date(year, month, 0).toISOString().slice(0,10); // last day

      // Fetch transactions for selected month with joins
      const { data: txns } = await supabase
        .from('transactions')
        .select('*, category:categories(*), bank:banks(*), company:companies(*)')
        .eq('user_id', session.user.id)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false });

      if (cancelled || !txns) return;

      // KPI calculations
      const income   = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expenses = txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
      const savings  = income - expenses;
      const rate     = income > 0 ? (savings / income) * 100 : 0;

      const kpi: KpiData = {
        income:      { value: income,   delta: 0 },
        expenses:    { value: expenses, delta: 0 },
        savings:     { value: savings,  delta: 0 },
        savingsRate: { value: rate,     delta: 0 },
      };

      // Fetch last 6 months for flow chart
      const sixMonthsAgo = new Date(year, month - 7, 1).toISOString().slice(0,10);
      const { data: flowTxns } = await supabase
        .from('transactions')
        .select('date, amount')
        .eq('user_id', session.user.id)
        .gte('date', sixMonthsAgo)
        .lte('date', to);

      const flowMap: Record<string, { income: number; expenses: number }> = {};
      (flowTxns || []).forEach(t => {
        const d    = new Date(t.date);
        const key  = d.toLocaleString('en-US', { month: 'short' });
        if (!flowMap[key]) flowMap[key] = { income: 0, expenses: 0 };
        if (t.amount > 0) flowMap[key].income   += t.amount;
        else              flowMap[key].expenses  += Math.abs(t.amount);
      });
      const flow: FlowMonth[] = Object.entries(flowMap).map(([m, v]) => ({ m, ...v }));

      // 50/30/20 split from category kinds
      const needTotal    = txns.filter(t => t.amount < 0 && t.category?.kind === 'need').reduce((s,t) => s + Math.abs(t.amount), 0);
      const wantTotal    = txns.filter(t => t.amount < 0 && t.category?.kind === 'want').reduce((s,t) => s + Math.abs(t.amount), 0);
      const savingsTotal = txns.filter(t => t.amount < 0 && t.category?.kind === 'savings').reduce((s,t) => s + Math.abs(t.amount), 0);
      const splitDenom   = needTotal + wantTotal + savingsTotal || 1;

      const split: SplitSegment[] = [
        { key:'needs',   label:'Needs',   value:needTotal,    target:50, actual:Math.round(needTotal/splitDenom*100),    color:'#7C5CFC' },
        { key:'wants',   label:'Wants',   value:wantTotal,    target:30, actual:Math.round(wantTotal/splitDenom*100),    color:'#F5B544' },
        { key:'savings', label:'Savings', value:savingsTotal, target:20, actual:Math.round(savingsTotal/splitDenom*100), color:'#33C58A' },
      ];

      // Budget by category
      const catMap: Record<string, { spent: number; budget: number; color: string }> = {};
      txns.filter(t => t.amount < 0).forEach(t => {
        const name = t.category?.name || 'Other';
        if (!catMap[name]) catMap[name] = { spent: 0, budget: t.category?.monthly_budget || 0, color: t.category?.color || '#7C5CFC' };
        catMap[name].spent += Math.abs(t.amount);
      });
      const budget: BudgetItem[] = Object.entries(catMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 8);

      setData({ kpi, flow, split, budget, transactions: txns as Transaction[], loading: false });
    }
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  return data;
}
