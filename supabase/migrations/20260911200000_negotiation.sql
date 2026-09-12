-- Negociação de proposta: o cliente pode solicitar um desconto, e o vendedor
-- pode aceitar, recusar ou fazer uma contraproposta (nova proposta, com a
-- anterior marcada como renegociada).

alter table public.proposals drop constraint if exists proposals_status_check;
alter table public.proposals
  add constraint proposals_status_check check (status in ('draft','sent','negotiating','accepted','rejected','expired','renegociada'));

create table if not exists public.proposal_negotiations (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  requested_total numeric(14,2) not null,
  requested_payment_terms text,
  message text,
  status text not null default 'open' check (status in ('open','accepted','rejected','countered')),
  responded_total numeric(14,2),
  responded_payment_terms text,
  new_proposal_id uuid references public.proposals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposal_negotiations_proposal_idx
  on public.proposal_negotiations(proposal_id, created_at desc);

alter table public.proposal_negotiations enable row level security;
revoke all on public.proposal_negotiations from anon, authenticated;
grant all on public.proposal_negotiations to service_role;
