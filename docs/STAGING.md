# Ambiente de testes — 08/09/2026

Worker publicado: https://orcafacil-staging.rrrgalhardo.workers.dev
Versão Cloudflare: `bfdccecd-94e5-454f-b71e-14823a6cecc4`.
Build e 18 testes locais passaram. Deploy feito com `wrangler.staging.jsonc`, sem push Git.
Apenas URL do site, URL Supabase e chave publicável configuradas. Faltam chave privilegiada do banco de staging, Auth URLs e credenciais dos provedores. Não há validação ponta a ponta de login/pagamento.

Supabase: `orcafacil-staging`, ref `kcmzejvrmtjjmhmfuilm`, us-east-2, ACTIVE_HEALTHY.
Produção permanece em `jobndmsargydskcsvnrk` e não foi alterada nesta etapa.

Aplicadas em staging as três migrations locais existentes: initial_orcafacil_schema, harden_handle_new_user_permissions e add_essential_plan_and_subscription_payments.

Também foram aplicadas via MCP duas migrations de permissões, ainda pendentes de sincronização para arquivos locais. O CLI não iniciou por falta de permissão para criar C:\Users\rodrigo\.supabase. Não inventar versões locais: recuperar histórico remoto e gerar pelo CLI quando disponível.

`grant_backend_table_access`:
```sql
grant usage on schema public to service_role;
grant select, insert, update, delete on public.profiles, public.proposals, public.proposal_items, public.proposal_events, public.subscriptions, public.subscription_payments to service_role;
grant usage, select on sequence public.proposal_number_seq, public.proposal_events_id_seq to service_role;
```

`restrict_auto_rls_function` (função criada pelo painel ao ativar RLS automático):
```sql
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
```

Verificação: seis tabelas com RLS; anon/authenticated sem CRUD direto; service_role com CRUD; consulta como service_role executada com sucesso e zero perfis. Função automática sem execução pública. Advisor de segurança sem WARN/ERROR; seis INFO de RLS sem policies, coerentes com acesso somente pelo backend. Ver https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy.

Mercado Pago: aplicação OrcaFacil Propostas, ID 6641891157113147. Contas brasileiras OrcaFacil Comprador Teste e OrcaFacil Vendedor Teste confirmadas no painel. Nenhum pagamento validado.

Próxima etapa: preparar Worker separado e suas credenciais de staging; configurar Auth e testar cadastro antes do fluxo de pagamento. Não usar chave do banco de produção. A lógica de cobrança ainda tem os bloqueios descritos em STATUS.md; não publicar cobrança real.
