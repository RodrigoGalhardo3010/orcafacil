-- Redesenho da negociação: uma proposta + linha do tempo (rodada única).
-- A contraproposta deixa de gerar uma proposta nova e vira uma rodada na mesma proposta.

-- 1. Baseline (valores originais) para a linha do tempo mostrar o "antes".
alter table public.proposals add column if not exists original_total numeric(14,2);
alter table public.proposals add column if not exists original_discount numeric(14,2);
alter table public.proposals add column if not exists original_payment_terms text;

-- 2. Tabela de rodadas (a linha do tempo completa, visível para os dois lados).
create table if not exists public.proposal_negotiation_rounds (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  seq int not null,
  actor text not null check (actor in ('buyer','seller')),
  kind text not null check (kind in ('request','counter','accept','reject')),
  total numeric(14,2),
  payment_terms text,
  message text,
  status text not null default 'open' check (status in ('open','accepted','rejected','superseded')),
  created_at timestamptz not null default now()
);
create index if not exists proposal_negotiation_rounds_proposal_idx
  on public.proposal_negotiation_rounds(proposal_id, seq);
alter table public.proposal_negotiation_rounds enable row level security;
revoke all on public.proposal_negotiation_rounds from anon, authenticated;
grant all on public.proposal_negotiation_rounds to service_role;

-- 3. Reparo dos dados antigos: dobrar a contraproposta de volta na proposta original.
-- 3a. Rodada do cliente (pedido).
insert into public.proposal_negotiation_rounds (proposal_id, seq, actor, kind, total, payment_terms, message, status, created_at)
select n.proposal_id, 1, 'buyer', 'request', n.requested_total, n.requested_payment_terms, n.message, 'superseded', n.created_at
from public.proposal_negotiations n
where n.status = 'countered';

-- 3b. Rodada do vendedor (contraproposta) — fica aberta, aguardando o cliente.
insert into public.proposal_negotiation_rounds (proposal_id, seq, actor, kind, total, payment_terms, message, status, created_at)
select n.proposal_id, 2, 'seller', 'counter', n.responded_total, n.responded_payment_terms, null, 'open', n.updated_at
from public.proposal_negotiations n
where n.status = 'countered';

-- 3c. Guarda os valores originais da proposta (baseline).
update public.proposals p
set original_total = p.total,
    original_discount = p.discount,
    original_payment_terms = p.payment_terms
from public.proposal_negotiations n
where n.proposal_id = p.id and n.status = 'countered' and p.original_total is null;

-- 3d. Volta a proposta original para "em negociação" (a contraproposta está pendente).
update public.proposals p
set status = 'negotiating', updated_at = now()
from public.proposal_negotiations n
where n.proposal_id = p.id and n.status = 'countered';

-- 3e. Remove a proposta-cópia gerada pela contraproposta antiga.
delete from public.proposals p
using public.proposal_negotiations n
where p.id = n.new_proposal_id and n.status = 'countered';

-- 3f. Segurança: nenhuma proposta pode ficar presa no status "renegociada".
update public.proposals set status = 'negotiating' where status = 'renegociada';

-- 4. Remove o status "renegociada" (agora é um fato da linha do tempo, não um estado).
alter table public.proposals drop constraint if exists proposals_status_check;
alter table public.proposals
  add constraint proposals_status_check check (status in ('draft','sent','negotiating','accepted','rejected','expired'));

-- 5. Remove a tabela antiga de negociação.
drop table if exists public.proposal_negotiations;
