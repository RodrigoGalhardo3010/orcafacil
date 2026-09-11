# Runbook de entrada em produção — OrçaFácil

> Regra do operador: **nunca** fazer compra com dinheiro real pelo site. Toda
> validação de cobrança usa contas de teste (sandbox) do Mercado Pago.

## Estado (11/09/2026)

### Staging — verde (parcial, aguardando matriz de 6 ofertas no navegador)

- Migration `20260910173653_billing_cycles_and_paid_periods` aplicada e verificada
  (colunas `billing_cycle`/`amount_cents`/`paid_through`, tabela
  `billing_checkout_attempts`, funções `record_billing_payment` e
  `claim_billing_checkout`).
- Segurança confirmada: RLS ativo, funções `SECURITY INVOKER`, `EXECUTE` apenas
  para `service_role` (anon/authenticated = 0).
- Advisors: só 1 WARN conhecido (proteção de senha vazada, feature paga).
- Deploy no ar (versão `abdd72f8`); `/precos` com as 6 ofertas; guarda de auth
  retorna 401 sem token; webhook rejeita assinatura inválida (401).
- 23 testes unitários verdes (preços em centavos, frequências 1/3/12, valor
  exato, `effectivePlan`, guardrails de IA).

### Produção — gaps mapeados (somente leitura)

- Banco `jobndmsargydskcsvnrk`: **schema inicial** (5 tabelas). Faltam 2 migrations:
  - `20260907120000_add_essential_plan_and_subscription_payments.sql`
  - `20260910173653_billing_cycles_and_paid_periods.sql`
- Worker `orcafacil`: secrets presentes = Supabase service role, Resend, DeepSeek.
  **Faltam**:
  - `NUXT_MERCADO_PAGO_ACCESS_TOKEN` (produção)
  - `NUXT_MERCADO_PAGO_WEBHOOK_SECRET`
  - `NUXT_EVENT_HASH_SECRET`

## Sequência de produção (só após staging 100% verde)

1. Aplicar as 2 migrations no banco de produção. O histórico de produção está
   limpo (batendo com os arquivos locais), então `db push` aplica transacional e
   grava o histórico:
   ```powershell
   cd D:\Orcafacil
   npx supabase db push --linked --project-ref jobndmsargydskcsvnrk
   # (dry-run confirmou: aplicaria 20260907120000 e 20260910173653)
   ```
2. Verificar RLS/grants e rodar advisors no banco de produção.
3. Configurar os secrets faltantes no Worker (valores nunca versionados/impressos):
   ```powershell
   npx wrangler secret put NUXT_MERCADO_PAGO_ACCESS_TOKEN --config wrangler.jsonc
   npx wrangler secret put NUXT_MERCADO_PAGO_WEBHOOK_SECRET --config wrangler.jsonc
   npx wrangler secret put NUXT_EVENT_HASH_SECRET --config wrangler.jsonc
   ```
4. Registrar o webhook de produção no Mercado Pago (endpoint `/api/billing/webhook`).
5. Conferir Auth Site URL + Redirect URLs no Supabase de produção.
6. Publicar: `npx wrangler deploy --config wrangler.jsonc`.
7. Validar com contas de teste (sandbox), sem dinheiro real.

## Critérios de gate (staging antes de produção)

- [ ] 6 ofertas (Essencial/Pro × mensal/trimestral/anual) criadas com `billing_cycle`/`frequency_months`/`amount_cents` corretos.
- [ ] Pagamento aprovado preenche `profiles.paid_through` e ativa o plano.
- [ ] Cancelamento interrompe a renovação mas conserva o acesso até `paid_through`.
- [ ] Webhook idempotente (duplicado/invertido não estende acesso).
- [ ] Expiração retorna o perfil ao plano Grátis.

## Rollback

- Código: reverter para o commit anterior em `main` e redeployar.
- Banco: as migrations são aditivas; rollback = ajustar colunas/funções
  manualmente em incidente (não há `DROP` automático).
