// Hook that fetches real data from Supabase for the current month/year.
// Falls back to static data if not authenticated.
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import {
  STATIC_KPI, STATIC_FLOW, STATIC_SPLIT, STATIC_BUDGET, STATIC_TRANSACTIONS,
} from './staticData';
import type { KpiData, FlowMonth, SplitSegment, BudgetItem, Transaction, CategoryBreakdownItem } from '../types/index';

export interface DashboardData {
  kpi:               KpiData;
  flow:              FlowMonth[];
  split:             SplitSegment[];
  budget:            BudgetItem[];
  transactions:      Transaction[];
  incomeCategories:  CategoryBreakdownItem[];
  expenseCategories: CategoryBreakdownItem[];
  savingsCategories: CategoryBreakdownItem[];
  trackedVsBudget:   { m: string; income: number; expenses: number; savings: number }[];
  loading:           boolean;
}

export function useDashboardData(year: number, month: number): DashboardData {
  const [data, setData] = useState<DashboardData>({
    kpi: STATIC_KPI, flow: STATIC_FLOW, split: STATIC_SPLIT,
    budget: STATIC_BUDGET, transactions: STATIC_TRANSACTIONS,
    incomeCategories: [], expenseCategories: [], savingsCategories: [],
    trackedVsBudget: [], loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setData(d => ({ ...d, loading: false }));
        return;
      }

      const from = `${year}-${String(month).padStart(2,'0')}-01`;
      const to   = new Date(year, month, 0).toISOString().slice(0,10);

      const { data: txns } = await supabase
        .from('transactions')
        .select('*, category:categories(*), bank:banks(*), company:companies(*)')
        .eq('user_id', session.user.id)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false });

      if (cancelled || !txns) return;

      // KPI — expenses exclude savings-kind; savings = sum of savings-kind outflows
      const income   = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expenses = txns.filter(t => t.amount < 0 && (t.category as any)?.kind !== 'savings').reduce((s, t) => s + Math.abs(t.amount), 0);
      const savings  = txns.filter(t => t.amount < 0 && (t.category as any)?.kind === 'savings').reduce((s, t) => s + Math.abs(t.amount), 0);
      const rate     = income > 0 ? (savings / income) * 100 : 0;

      const kpi: KpiData = {
        income:      { value: income,   delta: 0 },
        expenses:    { value: expenses, delta: 0 },
        savings:     { value: savings,  delta: 0 },
        savingsRate: { value: rate,     delta: 0 },
      };

      // Flow (last 6 months) — expenses exclude savings
      const sixMonthsAgo = new Date(year, month - 7, 1).toISOString().slice(0,10);
      const { data: flowTxns } = await supabase
        .from('transactions')
        .select('date, amount, category:categories(kind)')
        .eq('user_id', session.user.id)
        .gte('date', sixMonthsAgo)
        .lte('date', to);

      const flowMap: Record<string, { income: number; expenses: number }> = {};
      (flowTxns || []).forEach(t => {
        const key = new Date(t.date + 'T12:00:00').toLocaleString('en-US', { month: 'short' });
        if (!flowMap[key]) flowMap[key] = { income: 0, expenses: 0 };
        if (t.amount > 0) flowMap[key].income += t.amount;
        else if ((t.category as any)?.kind !== 'savings') flowMap[key].expenses += Math.abs(t.amount);
      });
      const flow: FlowMonth[] = Object.entries(flowMap).map(([m, v]) => ({ m, ...v }));

      // 50/30/20 split
      const needTotal    = txns.filter(t => t.amount < 0 && (t.category as any)?.kind === 'need').reduce((s,t) => s + Math.abs(t.amount), 0);
      const wantTotal    = txns.filter(t => t.amount < 0 && (t.category as any)?.kind === 'want').reduce((s,t) => s + Math.abs(t.amount), 0);
      const savingsTotal = txns.filter(t => t.amount < 0 && (t.category as any)?.kind === 'savings').reduce((s,t) => s + Math.abs(t.amount), 0);
      const splitDenom   = needTotal + wantTotal + savingsTotal || 1;

      const split: SplitSegment[] = [
        { key:'needs',   label:'Needs',   value:needTotal,    target:50, actual:Math.round(needTotal/splitDenom*100),    color:'#7C5CFC' },
        { key:'wants',   label:'Wants',   value:wantTotal,    target:30, actual:Math.round(wantTotal/splitDenom*100),    color:'#F5B544' },
        { key:'savings', label:'Savings', value:savingsTotal, target:20, actual:Math.round(savingsTotal/splitDenom*100), color:'#33C58A' },
      ];

      // Budget by category (top 8 expense categories, excluding savings)
      const catMap: Record<string, { spent: number; color: string }> = {};
      txns.filter(t => t.amount < 0 && (t.category as any)?.kind !== 'savings').forEach(t => {
        const name = (t.category as any)?.name || 'Other';
        const color = (t.category as any)?.color || '#7C5CFC';
        if (!catMap[name]) catMap[name] = { spent: 0, color };
        catMap[name].spent += Math.abs(t.amount);
      });
      const budget: BudgetItem[] = Object.entries(catMap)
        .map(([name, v]) => ({ name, spent: v.spent, budget: 0, color: v.color }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 8);

      // Category breakdown cards
      const CAT_COLORS = ['#7C5CFC','#F5B544','#33C58A','#3B7BCE','#D8443F','#F97316','#14B8A6','#8B5CF6'];
      function buildBreakdown(filtered: NonNullable<typeof txns>): CategoryBreakdownItem[] {
        const map: Record<string, number> = {};
        filtered.forEach(t => {
          const name = (t.category as any)?.name || 'Other';
          map[name] = (map[name] || 0) + Math.abs(t.amount);
        });
        const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
        const top = sorted.slice(0, 5).map(([name, value], i) => ({
          name, value: Math.round(value), color: CAT_COLORS[i % CAT_COLORS.length],
        }));
        const otherVal = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
        return [...top, { name: 'Other', value: Math.round(otherVal), color: '#ECEAF4' }];
      }

      const incomeCategories  = buildBreakdown(txns.filter(t => t.amount > 0));
      const expenseCategories = buildBreakdown(txns.filter(t => t.amount < 0 && (t.category as any)?.kind !== 'savings'));
      const savingsCategories = buildBreakdown(txns.filter(t => t.amount < 0 && (t.category as any)?.kind === 'savings'));

      // Tracked vs Budget — full year monthly breakdown
      const { data: yearTxns } = await supabase
        .from('transactions')
        .select('date, amount, category:categories(kind)')
        .eq('user_id', session.user.id)
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);

      const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const tvb: Record<string, { income: number; expenses: number; savings: number }> = {};
      MON.forEach(m => { tvb[m] = { income: 0, expenses: 0, savings: 0 }; });
      (yearTxns || []).forEach(t => {
        const m = MON[new Date(t.date + 'T12:00:00').getMonth()];
        if (t.amount > 0) tvb[m].income += t.amount;
        else if ((t.category as any)?.kind === 'savings') tvb[m].savings += Math.abs(t.amount);
        else tvb[m].expenses += Math.abs(t.amount);
      });
      const trackedVsBudget = MON.map(m => ({
        m,
        income:   Math.round(tvb[m].income),
        expenses: Math.round(tvb[m].expenses),
        savings:  Math.round(tvb[m].savings),
      }));

      setData({ kpi, flow, split, budget, transactions: txns as Transaction[], incomeCategories, expenseCategories, savingsCategories, trackedVsBudget, loading: false });
    }
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  return data;
}
