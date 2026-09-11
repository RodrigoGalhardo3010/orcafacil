-- Additive migration: existing subscriptions keep their agreed monthly price.
alter table public.subscriptions
  add column billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','quarterly','annual')),
  add column frequency_months integer not null default 1 check (frequency_months in (1,3,12)),
  add column price_version text not null default 'legacy-monthly',
  add column amount_cents integer,
  add column current_period_start timestamptz,
  add column current_period_end timestamptz;
update public.subscriptions set amount_cents = round(amount * 100)::integer;
alter table public.subscriptions add constraint subscriptions_positive_price check (amount_cents > 0);
alter table public.subscriptions add constraint subscriptions_cycle_frequency check (
  (billing_cycle='monthly' and frequency_months=1) or
  (billing_cycle='quarterly' and frequency_months=3) or
  (billing_cycle='annual' and frequency_months=12));

alter table public.profiles add column paid_through timestamptz;
alter table public.subscription_payments
  add column period_start timestamptz,
  add column period_end timestamptz,
  add column verified boolean not null default false,
  add column mercado_pago_payment_id text;

-- Backfill only previously approved exact-price payments. Do not manufacture
-- a new period from migration time or grant access from authorization alone.
update public.subscription_payments p set
  period_start=p.paid_at,
  period_end=p.paid_at + interval '1 month',
  verified=true
from public.subscriptions s
where s.provider=p.provider and s.provider_subscription_id=p.provider_subscription_id
  and s.user_id=p.user_id and p.status='approved' and p.paid_at is not null
  and round(p.amount*100)::integer=s.amount_cents;
update public.subscriptions s set
  current_period_start=q.period_start, current_period_end=q.period_end
from (
  select distinct on (provider,provider_subscription_id) provider,provider_subscription_id,period_start,period_end
  from public.subscription_payments where verified and status='approved'
  order by provider,provider_subscription_id,period_end desc
) q where q.provider=s.provider and q.provider_subscription_id=s.provider_subscription_id;
update public.profiles p set paid_through=s.current_period_end
from public.subscriptions s where s.user_id=p.id and s.provider_subscription_id=p.subscription_id;

-- Backend only. Row locks serialize duplicate/out-of-order payment processing.
create function public.record_billing_payment(
  p_subscription_id text, p_invoice_id text, p_payment_id text, p_status text,
  p_amount_cents integer, p_currency text, p_paid_at timestamptz, p_period_start timestamptz
) returns boolean language plpgsql security invoker set search_path='' as $$
declare s public.subscriptions; is_valid boolean; start_at timestamptz; end_at timestamptz;
begin
  select * into s from public.subscriptions
    where provider='mercadopago' and provider_subscription_id=p_subscription_id for update;
  if not found then return false; end if;
  is_valid := p_status='approved' and p_currency='BRL' and p_amount_cents=s.amount_cents
    and p_paid_at is not null and p_paid_at <= now() + interval '5 minutes'
    and p_period_start is not null and p_period_start <= now() + interval '5 minutes';
  start_at := case when is_valid then p_period_start end;
  end_at := start_at + make_interval(months=>s.frequency_months);
  insert into public.subscription_payments
    (user_id,provider,provider_payment_id,provider_subscription_id,status,amount,paid_at,
     period_start,period_end,verified,mercado_pago_payment_id)
  values (s.user_id,'mercadopago',p_invoice_id,p_subscription_id,p_status,p_amount_cents/100.0,p_paid_at,
     start_at,end_at,coalesce(is_valid,false),p_payment_id)
  on conflict(provider,provider_payment_id) do update set
    status=excluded.status, amount=excluded.amount, paid_at=excluded.paid_at,
    period_start=excluded.period_start,period_end=excluded.period_end,
    verified=excluded.verified,mercado_pago_payment_id=excluded.mercado_pago_payment_id,updated_at=now()
  -- A stale approved notification must never revive a reversed charge.
  where public.subscription_payments.status not in ('refunded','charged_back')
    and public.subscription_payments.provider_subscription_id=excluded.provider_subscription_id;
  select p.period_start,p.period_end into start_at,end_at from public.subscription_payments p
    where p.provider='mercadopago' and p.provider_subscription_id=p_subscription_id
      and p.verified and p.status='approved'
    order by p.period_end desc limit 1;
  update public.subscriptions set current_period_start=start_at,current_period_end=end_at,updated_at=now() where id=s.id;
  update public.profiles set
    plan=case when end_at>now() then s.plan else 'free' end,
    paid_through=end_at,updated_at=now()
    where id=s.user_id and subscription_id=p_subscription_id;
  return coalesce(end_at>now(),false);
end;
$$;
revoke all on function public.record_billing_payment(text,text,text,text,integer,text,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.record_billing_payment(text,text,text,text,integer,text,timestamptz,timestamptz) to service_role;

-- A persistent request id also covers retries after a provider timeout.
create table public.billing_checkout_attempts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  request_id uuid not null default gen_random_uuid(),
  plan text not null check(plan in ('essencial','pro')),
  cycle text not null check(cycle in ('monthly','quarterly','annual')),
  locked_until timestamptz not null,
  completed boolean not null default false
);
alter table public.billing_checkout_attempts enable row level security;
revoke all on public.billing_checkout_attempts from anon,authenticated;
grant all on public.billing_checkout_attempts to service_role;
create function public.claim_billing_checkout(p_user_id uuid,p_plan text,p_cycle text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare attempt public.billing_checkout_attempts;
begin
  perform 1 from public.profiles where id=p_user_id for update;
  if not found then raise exception 'profile missing'; end if;
  select * into attempt from public.billing_checkout_attempts where user_id=p_user_id;
  if found and attempt.locked_until>now() then raise exception 'checkout busy'; end if;
  if found and not attempt.completed and (attempt.plan<>p_plan or attempt.cycle<>p_cycle) then
    raise exception 'retry previous checkout first';
  end if;
  insert into public.billing_checkout_attempts(user_id,plan,cycle,locked_until)
    values(p_user_id,p_plan,p_cycle,now()+interval '2 minutes')
    on conflict(user_id) do update set
      request_id=case when public.billing_checkout_attempts.completed then gen_random_uuid() else public.billing_checkout_attempts.request_id end,
      plan=excluded.plan,cycle=excluded.cycle,locked_until=excluded.locked_until,completed=false
    returning request_id into attempt.request_id;
  return attempt.request_id;
end;
$$;
revoke all on function public.claim_billing_checkout(uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_billing_checkout(uuid,text,text) to service_role;
