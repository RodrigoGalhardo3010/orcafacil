# Plano direto para colocar o OrçaFácil em produção

Atualizado em 10/09/2026.

## Objetivo do lançamento

Publicar uma versão comercial segura que permita cadastro, criação de proposta com IA, revisão, PDF, envio por e-mail ou WhatsApp, aceite pelo link e contratação dos planos Essencial e Pro.

O primeiro lançamento não depende do chatbot receber pedidos dentro do WhatsApp. Essa integração será a próxima evolução, depois que o fluxo web provar aquisição, ativação e pagamento.

## Estado confirmado

- aplicação e banco de homologação separados da produção;
- cadastro, proposta com IA, PDF, e-mail, WhatsApp por compartilhamento, link público e aceite disponíveis;
- planos Grátis, Essencial e Pro implementados;
- compra de teste do Essencial concluída, com ativação do limite de 25 propostas;
- cancelamento de teste concluído, com retorno ao plano Grátis e interrupção das próximas cobranças;
- webhook de teste protegido por assinatura e validado pelo simulador oficial com HTTP 200;
- liberação do plano condicionada a pagamento aprovado, moeda BRL e preço exato;
- 20 testes automatizados e build Cloudflare aprovados;
- correção de cancelamento publicada no staging, versão `a601e303-8be1-4766-91f0-0d0e158af7c6`.

## Caminho crítico

### 0. Escopo adicional solicitado em 10/09/2026

Incluir ciclos trimestral e anual e renovar a identidade visual conforme a especificação abaixo. Os ciclos ainda não estão implementados. A primeira entrega visual está publicada no staging, versão `35d2d10b-ad5c-487c-bd5f-9cf1b934b95e`: landing renovada, tema escuro em preços, painel e formulário; proposta pública preservada em tema claro. Build e typecheck aprovados, scanner sem padrões de credenciais. Landing inspecionada em 1280px e 360px; preços, painel autenticado, formulário e demonstração pública conferidos no navegador. A arquitetura permanece Cloudflare + Supabase gerenciado + Resend + DeepSeek + Mercado Pago.

- implementar catálogo de ciclos e direitos de acesso antes de expor preços na interface;
- validar os seis produtos (dois planos, três ciclos) em staging, incluindo renovação, cancelamento, falha de pagamento e repetição de webhook;
- aplicar o visual primeiro na landing e preços, depois no painel e criação de propostas, com revisão no celular;
- só promover para produção os ciclos efetivamente homologados; compras reais controladas continuam sendo requisito para a abertura comercial.

### Ciclos e descontos

Desconto calculado sobre o valor mensal multiplicado pelo número de meses. Premissa de implementação: cobrança integral antecipada por período, renovada a cada 1, 3 ou 12 meses. Não é parcelamento mensal.

| Plano | Mensal | Trimestral: 30% de desconto | Anual: 50% de desconto |
| --- | ---: | ---: | ---: |
| Essencial | R$ 19,90 | R$ 41,79 por trimestre | R$ 119,40 por ano |
| Pro | R$ 39,90 | R$ 83,79 por trimestre | R$ 239,40 por ano |

Equivalentes mensais para comparação: Essencial R$ 13,93 trimestral / R$ 9,95 anual; Pro R$ 27,93 trimestral / R$ 19,95 anual. Exibir sempre o total cobrado, periodicidade, desconto e renovação junto ao botão. Mensal selecionado inicialmente, com seletor acessível Mensal / Trimestral / Anual.

O Essencial continua com 25 propostas por mês e o Grátis com 3. Pagar antecipadamente não acumula 75 ou 300 envios. Preservar o contador mensal atual nesta entrega e explicar sua data de reinício. O Pro permanece sem limite comercial de propostas, sujeito às proteções de uso documentadas.

Requisitos de cobrança:

- catálogo versionado no servidor com plano, ciclo, moeda, preço inteiro em centavos e duração; nunca confiar no preço recebido do navegador;
- persistir ciclo contratado, preço acordado e início/fim do período pago; preservar assinaturas mensais existentes;
- validar pagamento pelo contrato armazenado, substituindo a comparação atual apenas com o preço mensal;
- configurar e testar frequência de 1, 3 e 12 meses na API de assinaturas; não confundir frequência com número de repetições;
- separar estado da renovação de direito de acesso: cancelamento interrompe cobranças futuras, mas conserva acesso até o fim do período já pago. O retorno imediato ao Grátis testado na versão atual deverá ser revisto antes de vender períodos antecipados;
- tratar expiração, estorno e reembolso explicitamente; conciliar datas e impedir que notificações repetidas ou antigas estendam acesso indevidamente;
- na primeira entrega, agendar troca de ciclo/plano para o fim do período vigente; evitar cobrança dupla e cálculo proporcional improvisado;
- validar matriz de seis ofertas, valor adulterado, pagamento duplicado, moeda incorreta, renovação recusada, cancelamento e expiração com relógio controlado; validar o fluxo real do provedor em staging;
- definir e publicar regras de renovação, cancelamento e reembolso antes da abertura comercial.

O desconto anual reduz pela metade a receita mensal equivalente: reservar parte do recebimento para os 12 meses de operação e medir IA, e-mail e suporte por cliente. Manter os descontos solicitados no catálogo planejado e revisar a margem antes de aumentar investimento em aquisição.

Referência técnica: [API de planos de assinatura do Mercado Pago](https://www.mercadopago.com.br/developers/en/reference/online-payments/subscriptions/create-preapproval-plan/post).

### Direção visual premium

Conceito: ferramenta profissional de propostas para prestadores de serviços. A estética financeira comunica organização e confiança, mas o conteúdo central deve mostrar orçamento, cliente, itens, validade e aceite. Valores de propostas aceitas não devem ser rotulados como lucro ou dinheiro recebido.

- fundo principal #090A0F, superfícies em grafite e divisórias de 1px discretas; verde-esmeralda para ação principal e aprovação; demais estados identificados também por texto/ícone;
- títulos geométricos fortes e escala expressiva na landing; tamanhos fluidos no celular. Corpo legível, no mínimo 16px, e monoespaçada restrita a códigos, datas e valores; hospedar fontes localmente com fallback;
- hero assimétrico com uma proposta de demonstração realista, seus itens, total, validade e status; identificar claramente dados demonstrativos, sem métricas fictícias de clientes ou faturamento;
- painel bento com vidro fosco e borda sutil, limitado à apresentação; formulários e tabelas usam superfícies sólidas para leitura. Gráfico de linha somente se representar informação útil e identificada;
- dashboard organizado por ação: criar proposta, localizar cliente, acompanhar enviado/aceito e limite do plano. Evitar títulos gigantes dentro das tarefas diárias;
- hover com inclinação máxima de 1–2 graus apenas em cards de apresentação, nunca campos ou tabelas; brilho discreto nos CTAs, transições de 150–200ms, sem animação contínua;
- respeitar prefers-reduced-motion, teclado, foco visível e contraste WCAG AA; desativar tilt no toque e oferecer fallback sem backdrop-filter;
- PDF permanece claro e econômico para impressão; proposta pública prioriza leitura e botão de aceite evidente, com identidade consistente;
- verificar telas de 360px, tablet e desktop, textos longos, zoom 200%, estados vazios, carregamento e erro. Medir impacto de fontes, blur e animação no carregamento.

Ordem de entrega: catálogo e direitos de acesso → landing/preços premium → painel/criação → testes completos em staging → configuração de produção → compra real controlada → beta assistido e marketing.

### 1. Fechar a homologação

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
3. Escopo fechado nos novos ciclos e direção visual solicitados; outras funcionalidades ficam para depois da homologação comercial.
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
