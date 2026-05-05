-- Budget Dashboard — Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor > New query)

-- ── Categories ─────────────────────────────────────────────────────────────
create table if not exists categories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  color         text not null default '#7C5CFC',
  kind          text not null check (kind in ('income','need','want','savings')),
  monthly_budget numeric(12,2) default 0,
  created_at    timestamptz default now()
);
alter table categories enable row level security;
create policy "Users manage own categories" on categories
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Banks ──────────────────────────────────────────────────────────────────
create table if not exists banks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);
alter table banks enable row level security;
create policy "Users manage own banks" on banks
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Companies ──────────────────────────────────────────────────────────────
create table if not exists companies (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);
alter table companies enable row level security;
create policy "Users manage own companies" on companies
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Transactions ───────────────────────────────────────────────────────────
create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  amount      numeric(12,2) not null,  -- negative = expense, positive = income
  description text,
  category_id uuid references categories(id) on delete set null,
  bank_id     uuid references banks(id) on delete set null,
  company_id  uuid references companies(id) on delete set null,
  method      text check (method in ('card','transfer','cash','check','other')),
  created_at  timestamptz default now()
);
alter table transactions enable row level security;
create policy "Users manage own transactions" on transactions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Index for date-range queries (very common)
create index if not exists transactions_user_date on transactions(user_id, date desc);

-- ── Savings Goals ──────────────────────────────────────────────────────────
create table if not exists savings_goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  target     numeric(12,2) not null,
  current    numeric(12,2) not null default 0,
  deadline   date,
  color      text not null default '#7C5CFC',
  created_at timestamptz default now()
);
alter table savings_goals enable row level security;
create policy "Users manage own goals" on savings_goals
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Helper view: monthly KPIs ──────────────────────────────────────────────
-- Used by the dashboard to aggregate income/expenses per month quickly.
create or replace view monthly_totals as
select
  user_id,
  date_trunc('month', date)::date as month,
  sum(case when amount > 0 then amount else 0 end) as income,
  sum(case when amount < 0 then abs(amount) else 0 end) as expenses
from transactions
group by user_id, date_trunc('month', date);
