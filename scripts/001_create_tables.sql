-- OrbiFinance Database Schema
-- Create all necessary tables for the financial management system

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  preferred_language text default 'en' check (preferred_language in ('en', 'pt', 'es')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Accounts table (bank accounts, credit cards, cash, etc.)
create table if not exists public.accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking', 'savings', 'credit_card', 'cash', 'investment', 'other')),
  balance numeric(15, 2) default 0,
  currency text default 'USD',
  color text default '#3b82f6',
  icon text default 'wallet',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Categories table (income and expense categories)
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text default '#6b7280',
  icon text default 'tag',
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Transactions table
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(15, 2) not null,
  description text,
  date date not null default current_date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Financial Goals table
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(15, 2) not null,
  current_amount numeric(15, 2) default 0,
  deadline date,
  category text default 'savings',
  color text default '#10b981',
  icon text default 'target',
  is_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI Insights table (store AI-generated financial insights)
create table if not exists public.ai_insights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_type text not null check (insight_type in ('spending_pattern', 'saving_tip', 'budget_alert', 'goal_progress', 'general')),
  title text not null,
  content text not null,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Create indexes for better query performance
create index if not exists idx_accounts_user_id on public.accounts(user_id);
create index if not exists idx_categories_user_id on public.categories(user_id);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_account_id on public.transactions(account_id);
create index if not exists idx_transactions_date on public.transactions(date);
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_ai_insights_user_id on public.ai_insights(user_id);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.ai_insights enable row level security;
