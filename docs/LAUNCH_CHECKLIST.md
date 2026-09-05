# Checklist de lançamento

## Produto
- [ ] Supabase criado e migration aplicada
- [ ] Cadastro e login testados
- [ ] Criar/editar proposta
- [ ] Limite grátis de 3 envios/mês
- [ ] Link público
- [ ] Registro de visualização
- [ ] Aceite e recusa
- [ ] E-mail de proposta
- [ ] E-mail de resposta ao vendedor
- [ ] Checkout Mercado Pago
- [ ] Webhook de assinatura
- [ ] Upgrade e downgrade sincronizados

## Segurança
- [ ] Nenhuma secret key no GitHub
- [ ] Service role somente no Worker
- [ ] RLS habilitado
- [ ] Webhook secret configurado
- [ ] Event hash secret configurado
- [ ] Rate limiting do Cloudflare avaliado antes de tráfego pago

## Jurídico
- [ ] CNPJ/razão social do operador definidos
- [ ] Termos revisados por advogado
- [ ] Política de privacidade revisada
- [ ] Canal LGPD definido
- [ ] Política de cancelamento/reembolso definida
- [ ] Não vender "assinatura eletrônica" antes de revisão específica

## Marketing
- [ ] Domínio
- [ ] E-mail do domínio
- [ ] Página `/ar-condicionado`
- [ ] Demo pública revisada
- [ ] Lista inicial de 30 prospects
- [ ] Planilha de feedback
- [ ] 3 roteiros de abordagem
- [ ] Meta da primeira semana definida

## Go live
- [ ] Deploy Cloudflare
- [ ] domínio + SSL
- [ ] URLs de Auth atualizadas
- [ ] webhook de produção atualizado
- [ ] compra real de R$ 39,90 testada em conta controlada
- [ ] cancelamento testado
- [ ] mobile testado em Android e iPhone
