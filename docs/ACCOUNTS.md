# Contas necessárias

## 1. Supabase
Criar um projeto em região adequada ao público brasileiro.

Precisaremos de:
- Project URL
- Publishable key
- Secret/service role key (somente como secret do backend)

Em banco novo, aplicar `supabase/migrations/` em ordem. No projeto existente, as duas versões já estão aplicadas; conferir o histórico antes de qualquer alteração.

Auth:
- habilitar Email/Password;
- definir Site URL de produção;
- adicionar URL de desenvolvimento como redirect permitido.

## 2. Cloudflare
Criar conta e habilitar Workers.

Primeiro deploy pode usar `orcafacil.<conta>.workers.dev`.
Depois, conectar domínio próprio.

Secrets de produção:
- `NUXT_PUBLIC_SITE_URL`
- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NUXT_SUPABASE_SERVICE_ROLE_KEY`
- `NUXT_MERCADO_PAGO_ACCESS_TOKEN`
- `NUXT_MERCADO_PAGO_WEBHOOK_SECRET`
- `NUXT_RESEND_API_KEY`
- `NUXT_EVENT_HASH_SECRET`

## 3. Mercado Pago Developers
Criar uma aplicação para o OrçaFácil e obter Access Token de produção quando o MVP estiver validado.

Configurar Webhooks para o endpoint:
`https://SEU-DOMINIO/api/billing/webhook`

Evento principal do MVP:
- `subscription_preapproval`

Guardar a assinatura secreta do webhook no secret `NUXT_MERCADO_PAGO_WEBHOOK_SECRET`.

## 4. Resend
Criar conta, adicionar domínio e configurar DNS.

Precisaremos de:
- API key
- domínio verificado

No código inicial usamos `propostas@orcafacil.com.br` e `notificacoes@orcafacil.com.br`; ajuste se o domínio final for diferente.
