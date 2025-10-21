-- Triggers and Functions for OrbiFinance

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to all relevant tables
create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.accounts
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.categories
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.transactions
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.goals
  for each row
  execute function public.handle_updated_at();

-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, preferred_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.raw_user_meta_data ->> 'preferred_language', 'en')
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$;

-- Trigger to create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update account balance when transaction is created/updated/deleted
create or replace function public.update_account_balance()
returns trigger
language plpgsql
as $$
begin
  if (TG_OP = 'DELETE') then
    -- Revert the old transaction
    if old.type = 'income' then
      update public.accounts set balance = balance - old.amount where id = old.account_id;
    elsif old.type = 'expense' then
      update public.accounts set balance = balance + old.amount where id = old.account_id;
    end if;
    return old;
  elsif (TG_OP = 'UPDATE') then
    -- Revert old transaction
    if old.type = 'income' then
      update public.accounts set balance = balance - old.amount where id = old.account_id;
    elsif old.type = 'expense' then
      update public.accounts set balance = balance + old.amount where id = old.account_id;
    end if;
    -- Apply new transaction
    if new.type = 'income' then
      update public.accounts set balance = balance + new.amount where id = new.account_id;
    elsif new.type = 'expense' then
      update public.accounts set balance = balance - new.amount where id = new.account_id;
    end if;
    return new;
  elsif (TG_OP = 'INSERT') then
    -- Apply new transaction
    if new.type = 'income' then
      update public.accounts set balance = balance + new.amount where id = new.account_id;
    elsif new.type = 'expense' then
      update public.accounts set balance = balance - new.amount where id = new.account_id;
    end if;
    return new;
  end if;
  return null;
end;
$$;

-- Trigger to update account balance
create trigger update_account_balance_trigger
  after insert or update or delete on public.transactions
  for each row
  execute function public.update_account_balance();
