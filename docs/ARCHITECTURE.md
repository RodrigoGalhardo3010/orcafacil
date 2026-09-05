# Arquitetura do OrçaFácil

## Objetivo
MVP de micro-SaaS B2B com custo inicial próximo de zero, foco em proposta comercial via link e receita recorrente.

## Componentes
- **Frontend + API:** Nuxt 4 em Cloudflare Workers.
- **Autenticação + PostgreSQL:** Supabase.
- **Cobrança recorrente:** Mercado Pago Assinaturas (`/preapproval`).
- **E-mail transacional:** Resend.
- **DNS/SSL:** Cloudflare.

## Fluxo de segurança
1. O browser autentica no Supabase e recebe um access token.
2. O browser envia o token no header `Authorization` para as APIs do Nuxt.
3. O backend valida o token com Supabase Auth.
4. O backend usa a service role para acessar o PostgreSQL.
5. Nenhuma service key, token do Mercado Pago ou chave do Resend é exposta no browser.
6. RLS fica habilitado e as tabelas não são acessíveis diretamente por `anon` ou `authenticated`.

## Fluxo da proposta
Usuário -> cria rascunho -> edita -> envia -> link público -> cliente visualiza -> aceita/recusa -> evento é registrado -> usuário é notificado.

## Fluxo de cobrança
Usuário -> `POST /api/billing/checkout` -> Mercado Pago cria assinatura pending -> usuário conclui checkout -> retorno ao dashboard -> sync via API + webhook -> perfil passa a `plan=pro` quando status é `authorized`.

## Privacidade
Não armazenamos IP puro do cliente da proposta. O endpoint de eventos cria HMAC de IP + user-agent para fornecer evidência técnica básica sem reter o identificador bruto.

## Decisões deliberadas do MVP
- Um plano pago principal: Pro R$ 39,90/mês.
- Sem PDF server-side na primeira versão; impressão do navegador pode ser usada temporariamente.
- Sem assinatura eletrônica qualificada. O produto registra aceite comercial.
- Sem múltiplos usuários por conta no MVP.
- Sem IA no fluxo inicial: primeiro validar disposição de pagar.
