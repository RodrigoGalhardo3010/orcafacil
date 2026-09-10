# Plano de QA do MVP

## Smoke test
1. Criar conta nova.
2. Confirmar e-mail (se habilitado).
3. Entrar no dashboard.
4. Criar proposta com 2 itens e desconto.
5. Editar a proposta.
6. Enviar e copiar o link.
7. Abrir link em janela anônima/mobile.
8. Confirmar registro de visualização.
9. Aceitar com nome.
10. Confirmar status no dashboard e e-mail do vendedor.

## Limite gratuito
- Enviar 3 propostas novas no mesmo mês: permitido.
- Tentar enviar a 4ª: deve retornar cobrança/upgrade.
- Reenviar proposta já enviada: permitido e não consome novo slot.

## Limites pagos
- Plano Essencial: permitir 25 propostas novas no mês e bloquear a 26ª.
- Plano Pro: não impor limite mensal.
- Trocar entre Essencial e Pro e confirmar preço, limite e identificação do plano.

## Billing
- Criar checkout pending.
- Concluir com conta de teste do Mercado Pago.
- Voltar ao dashboard e sincronizar.
- Confirmar `profiles.plan = essencial` para R$ 19,90 e `profiles.plan = pro` para R$ 39,90 quando `preapproval.status = authorized`.
- Confirmar registro de cada mensalidade em `subscription_payments` sem duplicar notificações repetidas.
- Cancelar assinatura e confirmar downgrade após webhook/sync.

## Segurança
- Confirmar que `.env` não entra no git.
- Procurar por `APP_USR-`, `re_`, `sb_secret_` no repositório antes do push.
- Chamar API autenticada sem Bearer: 401.
- Tentar acessar tabela com publishable key diretamente: sem permissão.
- Enviar webhook inválido quando secret estiver configurado: 401.

## Mobile
Testar 360 px, 390 px e 430 px, além de desktop. Prioridade: página pública da proposta e botões de aceite.
