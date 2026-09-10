alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'essencial', 'pro'));

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_payment_id text not null,
  provider_subscription_id text not null,
  status text not null,
  amount numeric(14,2) not null default 0,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_payment_id)
);

create index if not exists subscription_payments_user_created_idx
  on public.subscription_payments(user_id, created_at desc);
create index if not exists subscription_payments_subscription_idx
  on public.subscription_payments(provider, provider_subscription_id);

alter table public.subscription_payments enable row level security;
revoke all on public.subscription_payments from anon, authenticated;
