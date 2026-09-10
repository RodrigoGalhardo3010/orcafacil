# Estado verificado — 07/09/2026

## Produto

O OrçaFácil está publicado em Cloudflare Workers e possui cadastro/login, dashboard, entrevista de proposta com IA, edição, PDF, e-mail, compartilhamento por WhatsApp, link público e aceite/recusa. Supabase mantém autenticação e dados; Resend envia e-mails; DeepSeek atende a entrevista comercial.

Planos preparados no código:

- Grátis: 3 propostas enviadas por mês;
- Essencial: R$ 19,90 por mês e até 25 propostas;
- Pro: R$ 39,90 por mês e propostas ilimitadas.

## Cobrança

Há uma implementação local, ainda sem commit/publicação, de seleção de planos, preço definido no servidor, troca, cancelamento e webhook assinado. A proteção contra duplicidade é parcial: um checkout pendente pode ser reutilizado, mas requisições simultâneas ou falhas entre o provedor e o banco ainda precisam de tratamento. O registro de mensalidades usa uma chave única, mas ainda não determina corretamente o período pago nem a inadimplência.

O código atual libera o plano pelo status `authorized` da assinatura. Esse status não comprova recebimento da mensalidade. A confirmação deve consultar o pagamento relacionado à fatura, validar valor, moeda e vínculo e calcular o acesso pelo período pago. Uma fatura `processed` também pode terminar com pagamento recusado. Ver [documentação do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/integration-configuration/subscription-no-associated-plan/authorized-payments).

A cobrança ainda não está ativa em produção. Faltam a migration `20260907120000_add_essential_plan_and_subscription_payments.sql`, as credenciais de produção `NUXT_MERCADO_PAGO_ACCESS_TOKEN` e `NUXT_MERCADO_PAGO_WEBHOOK_SECRET`, o registro do webhook no Mercado Pago e duas compras reais controladas.

O dinheiro das assinaturas entra na conta Mercado Pago associada ao Access Token de produção. Cloudflare e Supabase não recebem nem custodiam o pagamento.

## Validação local

Em 07/09/2026 passaram:

- 18 testes automatizados na rodada anterior, com respostas simuladas;
- verificação TypeScript;
- build Nuxt para Cloudflare Workers;
- scanner de padrões de credenciais, sem segredos encontrados.

Os testes de cobrança usam respostas controladas e não movimentam dinheiro.

## Conferência remota e revisão de produção

- Supabase respondeu como `ACTIVE_HEALTHY`.
- Apenas as duas migrations iniciais constam no histórico remoto.
- As cinco tabelas públicas têm RLS habilitada e nenhum privilégio direto de leitura/escrita para `anon` ou `authenticated`, confirmado por consulta. O isolamento entre contas ainda precisa de testes das APIs, pois o servidor usa credenciais privilegiadas.
- O Security Advisor apontou avisos informativos de RLS sem policies, compatíveis com esse modelo de acesso, e proteção contra senhas vazadas desativada. Essa proteção depende de plano Supabase Pro ou superior: [documentação](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- A revisão local encontrou contagem mensal sem transação, edição e reenvio permitidos após resposta, aceite/recusa sem atualização condicional e ausência de limite por conta nas chamadas de IA. São pendências anteriores ao lançamento pago.
- Backup restaurável, ambiente de teste separado, domínio e remetente de autenticação próprios, limites de custos e recuperação de incidentes ainda precisam ser comprovados. Logs habilitados no Worker não comprovam alertas operacionais configurados.

## Pendências para lançamento comercial

1. preparar ambiente de teste e backup com restauração verificada;
2. concluir concorrência, persistência e acesso por período pago na cobrança, além de integridade das propostas e proteção contra abuso;
3. validar migrations, credenciais e webhooks em teste antes de configurar cobranças reais;
4. testar compra, renovação, recusa, troca, cancelamento, estorno e notificações repetidas ou atrasadas;
5. configurar `NUXT_EVENT_HASH_SECRET`, monitoramento, alertas, domínio e remetentes próprios;
6. definir política comercial, suporte, orçamento operacional e atualizar Termos/Privacidade;
7. testar restauração, reversão de deploy, carga e dispositivos móveis; iniciar beta assistido antes de tráfego pago.

O plano de lançamento e escala está em `docs/LAUNCH_AND_SCALE.md`.
