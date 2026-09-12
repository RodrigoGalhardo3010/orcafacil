# OrçaFácil — regras permanentes para agentes de IA

Este arquivo é a **memória operacional** do projeto. Leia inteiro antes de alterar,
publicar ou tocar em serviços externos. Ele tem prioridade sobre suposições.

Última atualização: 2026-09-12.

## Regras obrigatórias (nunca violar)

1. **NUNCA faça compras reais.** Não conclua pagamento, não pague assinatura e não use
   cartão/PIX real em nenhum ambiente. A cobrança está ativa em produção. Testes de
   pagamento só com credenciais de teste (sandbox) e comprador de teste.

2. **SEMPRE revise telas visualmente antes de publicar.** Mudança de UI não está pronta
   sem um **screenshot real conferido**. Fluxo no Windows:
   - subir o dev server em background: `npm run dev`
   - aguardar `http://localhost:3000` responder 200
   - capturar com Chrome headless:
     ```powershell
     & "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu `
       --hide-scrollbars --no-first-run --user-data-dir="D:\Orcafacil\.chrome-tmp" `
       --window-size=1280,1000 --screenshot="D:\Orcafacil\.tmp-tela.png" "http://localhost:3000/<rota>"
     ```
   - **abrir o PNG e conferir** espaçamento, alinhamento e texto
   - apagar os PNGs e o `.chrome-tmp` (não commitar)
   Erros já cometidos por não revisar: combo de filtro minúsculo; links colados no login.

3. **Nunca imprimir, colar ou commitar segredos.** `service_role`, token do Mercado Pago,
   chave do Resend e afins ficam só nos secrets do Cloudflare. O usuário roda
   `wrangler secret put` por conta própria. O projeto não é open source.

4. **Validar antes de publicar:** `npm test`, `npm run typecheck`, `npm run build` e,
   quando mexer em segredos, `npm run check:secrets`. Conferir o exit code real.

5. **Publicar primeiro em staging, depois produção.**
   - staging: `npx --no-install wrangler deploy --config wrangler.staging.jsonc`
   - produção: `npx --no-install wrangler deploy --config wrangler.jsonc`
   - migração: `npx --yes supabase db query --linked --project-ref <ref> --file <arquivo>`
     (aplicar em staging **e** produção)

6. **Nunca destruir trabalho:** sem `reset --hard`, `checkout` destrutivo ou apagar
   arquivos sem confirmação.

7. **Responder em português**, direto e sem jargão, dizendo o que foi verificado e o que
   ficou pendente. Terminar com commit + push: `git push origin HEAD:main`.

## Ambiente atual

- Repositório local: `D:\Orcafacil` (branch `main`, remoto `RodrigoGalhardo3010/orcafacil`).
- Staging: https://orcafacil-staging.rrrgalhardo.workers.dev — Supabase `kcmzejvrmtjjmhmfuilm`
- Produção: https://easybudget.operatehub.cloud (+ https://orcafacil.rrrgalhardo.workers.dev) — Supabase `jobndmsargydskcsvnrk`
- Cloudflare account id: `2f3b8c5912c84da6e89f87a82246504e`
- E-mail transacional: Resend, domínio `operatehub.cloud` (registros DNS propagados).
- Auth: Supabase, com **confirmação de e-mail obrigatória** no cadastro.

## Estado do produto (2026-09-12)

- **Cobrança:** Mercado Pago `/preapproval` (mensal, trimestral, anual). 6 secrets em produção.
- **Negociação:** uma proposta + **linha do tempo única** (rodada única; contraproposta única).
- **Recuperação de senha:** páginas `/recuperar-senha` e `/redefinir-senha`.
- **Conta admin:** `is_admin` no perfil concede uso ilimitado, imune à cobrança.
- **Pendências do dono:** liberar as *Redirect URLs* no Supabase Auth; configurar o
  **SMTP do Resend** no Supabase (o e-mail padrão do Supabase é limitado e cai em spam).

## Antes de declarar algo pronto

Não declarar pronto sem evidência de: testes, typecheck, build, screenshot (se for tela),
aplicação de migração e deploy. Se houver bloqueio por acesso/aprovação, registrar o erro
exato e continuar o que der.
