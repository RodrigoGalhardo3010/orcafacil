# OrçaFácil

Micro-SaaS para criar, enviar e registrar o aceite de propostas comerciais online.

## Stack
- Nuxt 4 + Cloudflare Workers
- Supabase Auth + PostgreSQL
- Mercado Pago Assinaturas
- Resend

## Rodar localmente
1. Instale Node.js atual/LTS compatível com Nuxt e Wrangler.
2. Copie `.env.example` para `.env`.
3. Preencha as credenciais de desenvolvimento.
4. Em um banco novo, aplique os arquivos de `supabase/migrations/` em ordem. As versões correspondem às duas migrations já aplicadas no projeto existente; não reaplique manualmente nesse projeto.
5. Rode:

```bash
npm ci
npm run dev
```

## Build
```bash
npm run build
```

## Deploy Cloudflare
A documentação atual do Cloudflare detecta projetos Nuxt e usa `.output/server/index.mjs` + `.output/public` no Worker.

```bash
npx wrangler login
npm run deploy
```

Configure os secrets no Cloudflare antes do deploy produtivo.

## Funcionalidades implementadas
- landing page e página vertical para ar-condicionado;
- cadastro/login via Supabase Auth;
- dashboard;
- criação e edição de proposta;
- itens, valores, desconto e condições;
- limite grátis de 3 propostas enviadas/mês;
- link público com branding no plano grátis;
- registro de visualização sem armazenar IP puro;
- aceite/recusa com nome/e-mail opcional;
- e-mails via Resend;
- assinatura recorrente Pro R$ 39,90 via Mercado Pago;
- webhook + sincronização manual de assinatura;
- migrations, documentação, marketing e checklist de lançamento.

## Antes de produção
Leia `docs/ACCOUNTS.md` e `docs/LAUNCH_CHECKLIST.md`.
O status verificado e os bloqueios atuais estão em `docs/STATUS.md`.

## Observação jurídica
O MVP registra aceite comercial e metadados técnicos. Ele não deve ser divulgado como plataforma de assinatura eletrônica qualificada sem análise jurídica e técnica específica.
