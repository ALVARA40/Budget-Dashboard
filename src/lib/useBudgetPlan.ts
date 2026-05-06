import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export interface BudgetPlanRow {
  category: string;
  month: number;   // 1-12
  amount: number;
}

export function useBudgetPlan(year: number) {
  const [plan, setPlan] = useState<Record<string, Record<number, number>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data } = await supabase
        .from('budget_plan')
        .select('category, month, amount')
        .eq('user_id', session.user.id)
        .eq('year', year);
      if (cancelled) return;
      const map: Record<string, Record<number, number>> = {};
      (data || []).forEach((r: any) => {
        if (!map[r.category]) map[r.category] = {};
        map[r.category][r.month] = r.amount;
      });
      setPlan(map);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [year]);

  const getValue = useCallback((category: string, month: number, fallback: number): number => {
    return plan[category]?.[month] ?? fallback;
  }, [plan]);

  const setValue = useCallback((category: string, month: number, amount: number) => {
    setPlan(p => ({
      ...p,
      [category]: { ...(p[category] || {}), [month]: amount },
    }));
  }, []);

  const saveAll = useCallback(async (rows: BudgetPlanRow[]) => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return false; }
    const upsertRows = rows.map(r => ({
      user_id: session.user.id,
      year,
      category: r.category,
      month: r.month,
      amount: r.amount,
    }));
    const { error } = await supabase
      .from('budget_plan')
      .upsert(upsertRows, { onConflict: 'user_id,year,category,month' });
    setSaving(false);
    return !error;
  }, [year]);

  return { plan, loading, saving, getValue, setValue, saveAll };
}
