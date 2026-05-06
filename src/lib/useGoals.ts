import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
}

const GOAL_COLORS = ['#7C5CFC','#33C58A','#F5B544','#3B7BCE','#D8443F','#1F3F8A'];

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    if (data) setGoals(data as Goal[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addGoal = useCallback(async (name: string, target: number, current: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const color = GOAL_COLORS[goals.length % GOAL_COLORS.length];
    const { data } = await supabase
      .from('goals')
      .insert({ user_id: session.user.id, name, target, current, color })
      .select('*')
      .single();
    if (data) setGoals(g => [...g, data as Goal]);
  }, [goals.length]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Pick<Goal, 'name' | 'target' | 'current'>>) => {
    const { data } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (data) setGoals(g => g.map(goal => goal.id === id ? { ...goal, ...data } : goal));
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    setGoals(g => g.filter(goal => goal.id !== id));
  }, []);

  return { goals, loading, addGoal, updateGoal, deleteGoal, reload: load };
}
