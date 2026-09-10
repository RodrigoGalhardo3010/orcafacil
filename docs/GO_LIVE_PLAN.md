# Plano direto para colocar o OrçaFácil em produção

Atualizado em 10/09/2026.

## Objetivo do lançamento

Publicar uma versão comercial segura que permita cadastro, criação de proposta com IA, revisão, PDF, envio por e-mail ou WhatsApp, aceite pelo link e contratação dos planos Essencial e Pro.

O primeiro lançamento não depende do chatbot receber pedidos dentro do WhatsApp. Essa integração será a próxima evolução, depois que o fluxo web provar aquisição, ativação e pagamento.

## Estado confirmado

- aplicação e banco de homologação separados da produção;
- cadastro, proposta com IA, PDF, e-mail, WhatsApp por compartilhamento, link público e aceite disponíveis;
- planos Grátis, Essencial e Pro implementados;
- compra de teste do Essencial concluída;
- webhook de teste protegido por assinatura e validado pelo simulador oficial com HTTP 200;
- liberação do plano condicionada a pagamento aprovado, moeda BRL e preço exato;
- 20 testes automatizados e build Cloudflare aprovados;
- correção publicada no staging, versão `0df7313c-d995-42de-bf0d-86011773d590`.

## Caminho crítico

### 1. Fechar a homologação

- executar uma compra limpa do Essencial e confirmar que o plano só ativa após pagamento aprovado;
- cancelar a assinatura e confirmar retorno ao Grátis;
- executar uma compra limpa do Pro;
- testar uma proposta completa no celular: IA, PDF, e-mail, WhatsApp e aceite.

### 2. Preparar a produção

- revisar o diff e executar scanner de segredos;
- consolidar as alterações em um commit e publicar no GitHub;
- aplicar a migration de planos e pagamentos no Supabase de produção;
- conferir RLS, privilégios, Auth Site URL e Redirect URLs;
- instalar no Cloudflare de produção os secrets de Supabase, Resend, DeepSeek, Mercado Pago e hash de eventos;
- retirar qualquer e-mail de comprador de teste da configuração produtiva.

### 3. Ativar a cobrança real

- configurar no Mercado Pago o webhook de produção;
- instalar no Worker a assinatura secreta de produção;
- fazer uma compra real controlada do Essencial e conferir plano, lançamento e valor recebido;
- cancelar e conferir o encerramento;
- repetir uma compra real controlada do Pro;
- só então liberar os botões de compra ao público.

### 4. Lançar e observar

- publicar domínio, SSL e e-mail do domínio, ou assumir explicitamente o endereço `workers.dev` durante o beta;
- definir canal de suporte, identificação do operador e política de cancelamento;
- ativar logs de erro e métricas mínimas do funil;
- abrir o beta para os primeiros dez usuários acompanhados pessoalmente.

O plano de capacidade, custos e migração dos serviços gratuitos está em
[SCALING_AND_COSTS.md](SCALING_AND_COSTS.md).

## Regras para ganhar velocidade

1. Uma etapa por vez, com evidência objetiva de sucesso.
2. Staging antes de produção; produção sem alterações experimentais.
3. Nenhuma nova funcionalidade até as duas compras reais e o cancelamento passarem.
4. Não iniciar anúncios pagos antes de observar cinco usuários criando e enviando propostas reais.
5. Correções entram em lote único: teste, build, staging, validação, GitHub e produção.

## Plano de marketing do lançamento

### Oferta inicial

- Grátis: 3 propostas por mês;
- Essencial: R$ 19,90 por mês, até 25 propostas;
- Pro: R$ 39,90 por mês, propostas ilimitadas.

Promessa: **transforme uma conversa em um orçamento profissional com IA, PDF e aceite pelo link.**

### Público inicial

Começar com instaladores e pequenas empresas de climatização. O produto atende outras áreas, mas uma campanha específica comunica melhor e permite comparar resultados. Mecânica, marcenaria e serviços odontológicos entram depois que o primeiro segmento gerar uso recorrente.

### Primeiros 14 dias

- montar uma demonstração completa e um vídeo curto de uso no celular;
- abordar dez profissionais por dia com mensagem personalizada;
- acompanhar a primeira proposta de cada novo usuário;
- registrar origem, cadastro, primeira proposta, envio e contratação;
- pedir dois depoimentos somente após uso real e com autorização;
- corrigir apenas os três problemas que mais impedirem envio ou pagamento.

### Critérios para investir em divulgação

- pelo menos cinco usuários enviaram uma proposta real;
- pelo menos três voltaram para criar outra proposta;
- pelo menos dois contrataram um plano;
- nenhum erro crítico de cobrança, e-mail, PDF ou aceite permaneceu aberto.

Depois desses sinais, testar mídia paga com orçamento pequeno e uma única campanha para climatização. Escalar investimento somente se o custo de aquisição puder ser recuperado com margem dentro de poucos meses.

## Próxima evolução após o lançamento

O chatbot de WhatsApp recebe mensagens em linguagem natural, identifica o profissional e seu plano, coleta os dados faltantes com exemplos, monta um rascunho, pede confirmação explícita, cria a proposta e envia PDF mais link. Ele deve usar a API oficial do WhatsApp, fila para processamento, idempotência por mensagem, limite por conta, registro de consentimento e guardrails para permanecer no contexto de orçamento.
