# Lançamento e escala do OrçaFácil

## Proposta comercial e planos

O OrçaFácil transforma uma conversa sobre serviço em uma proposta profissional com IA, PDF, envio e aceite pelo link. A promessa de entrada deve ser concreta: **crie e envie um orçamento profissional em poucos minutos, direto do celular**.

| Plano | Preço mensal | Limite | Papel no funil |
| --- | ---: | ---: | --- |
| Grátis | R$ 0 | 3 envios | provar valor com clientes reais |
| Essencial | R$ 19,90 | 25 envios | opção principal para autônomos |
| Pro | R$ 39,90 | ilimitado | empresas e profissionais com alto volume |

Não oferecer plano anual antes de validar retenção por pelo menos três meses. O desconto anual esconde cancelamento e reduz a qualidade do aprendizado no início.

## Portões para produção

O lançamento pago depende de evidências para as etapas abaixo. As alterações de assinatura estão preparadas localmente, mas não foram publicadas nem homologadas no provedor. A migration isolada não conclui a cobrança.

1. **Base operacional:** confirmar titular da conta Mercado Pago, acesso administrativo protegido por MFA, domínio e orçamento de infraestrutura. Preparar homologação separada, backup e teste de restauração antes de mudar o banco produtivo.
2. **Segurança e integridade:** testar isolamento entre dois usuários; tornar atômicos os limites, a edição dos itens e o aceite/recusa; preservar a versão aceita e bloquear reenvio que reabra uma proposta respondida; aplicar limites por conta e por origem para IA, PDF, e-mail e rotas públicas. Guardrails da IA complementam a autorização do servidor.
3. **Cobrança em homologação:** persistir tentativas para recuperar falhas sem criar outra assinatura; validar assinatura e vínculo de webhooks; confirmar pagamento aprovado e período de acesso. `authorized` da assinatura e `processed` da fatura não comprovam, isoladamente, recebimento. Tratar mensalidade recusada, notificações repetidas/fora de ordem, estorno e cancelamento. Proposta de política: interromper novas renovações ao cancelar, preservando o período já pago; confirmar essa política com o operador antes da implementação final.
4. **Operação produtiva:** instalar credenciais privadas como secrets no Cloudflare, configurar webhooks e reconciliação periódica, concluir domínio e e-mail próprio para autenticação e propostas. Testar compra real controlada somente com comprador e pagamento autorizados, verificando recebimento, taxas efetivas e cancelamento. Nenhuma compra real foi feita nesta revisão.
5. **Liberação:** suporte definido, Termos/Privacidade com informações reais, fluxo móvel aprovado, alertas recebidos, reversão de deploy testada e carga simulada em homologação. Começar com dez prestadores e acompanhar os primeiros envios.

## Condução passo a passo

O assistente executa revisão, correções, testes e documentação. Rodrigo resolve acesso, identidade da conta recebedora, orçamento, domínio e dados do operador. Pedir uma ação por vez e só avançar na configuração dependente quando houver confirmação. Chaves privadas devem ser inseridas no gerenciador de secrets; não precisam ser enviadas no chat.

Próxima informação necessária: confirmar se Rodrigo já possui a conta Mercado Pago que receberá as assinaturas. Depois conferir ou criar a aplicação OrçaFácil em Suas integrações e preparar o ambiente de testes.

## Escalabilidade e controle de custo desde o lançamento

Manter Nuxt/Cloudflare/Supabase inicialmente. Dimensionar pela carga observada, incluindo concorrência de IA, tamanho dos PDFs e consultas ao banco. Contagem de cadastros sozinha não mede capacidade.

- Antes do beta: paginação do painel, limites de tamanho de entrada, tempo máximo de chamadas externas, quotas de abuso, logs sem conteúdo sensível, alertas de erros/custos e backup restaurável.
- Para tarefas demoradas ou que precisam sobreviver a falhas: fila durável para envio e conciliação, com novas tentativas, identificação única e tratamento das falhas definitivas. Preparar isso antes da ativação paga quando a entrega depender do mecanismo; não esperar uma quantidade arbitrária de assinantes.
- Medir latência de 95% das requisições, erros, espera na fila, consumo do banco e custo por conta ativa. Definir os limites de aceite a partir do teste de carga em homologação e do orçamento aprovado.
- Alertar antes de esgotar os orçamentos de infraestrutura e de IA. Limites de CPU do Worker não limitam o total gasto com fornecedores externos.
- O Pro mantém propostas ilimitadas conforme a oferta; uso automatizado abusivo e consumo de IA precisam de política explícita, visível antes da contratação. Não introduzir depois uma quota oculta que contradiga a oferta.
- Custos devem incluir Cloudflare, Supabase, DeepSeek, Resend, domínio e taxas do Mercado Pago. Cotar os planos vigentes e aprovar gasto antes de qualquer contratação.

Referências: [produção no Supabase](https://supabase.com/docs/guides/deployment/going-into-prod), [filas Cloudflare](https://developers.cloudflare.com/queues/), [limites por rota/usuário](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [limites do Worker](https://developers.cloudflare.com/workers/platform/limits/) e [ciclo das cobranças recorrentes](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/integration-configuration/subscription-no-associated-plan/authorized-payments).

## Estratégia dos primeiros 30 dias

O produto pode atender várias áreas, mas a divulgação precisa começar com uma mensagem específica. Usar climatização como primeiro grupo e escolher apenas um segundo grupo entre mecânica, marcenaria ou serviços odontológicos. Comparar os grupos sem misturar mensagens.

### Semana 1 — beta assistido

- recrutar 10 profissionais por indicação, Google Maps e contatos locais;
- acompanhar por chamada ou WhatsApp a criação da primeira proposta;
- observar tempo até o primeiro envio, dúvidas e campos corrigidos depois da IA;
- não investir em anúncios;
- meta: 7 contas enviando uma proposta real e 3 enviando uma segunda proposta.

### Semana 2 — validar ativação e preço

- chegar a 30 profissionais abordados com mensagem personalizada;
- mostrar uma proposta de exemplo do mesmo segmento do contato;
- convidar o usuário a testar em um cliente real naquele momento;
- oferecer o Essencial quando o limite grátis for alcançado;
- meta: 15 cadastros, 8 usuários ativados e os 3 primeiros assinantes.

### Semanas 3 e 4 — repetição controlada

- corrigir as três maiores fricções observadas;
- publicar uma página de venda específica para cada segmento testado;
- coletar depoimentos somente com autorização;
- iniciar conteúdo curto mostrando antes/depois de um orçamento no WhatsApp;
- testar indicação: um mês de Essencial após o indicado pagar a primeira mensalidade;
- meta acumulada: 100 abordagens qualificadas, 30 cadastros, 15 ativados e 5 a 10 pagantes.

## Funil que decide os próximos investimentos

| Etapa | Métrica inicial | Ação quando estiver abaixo |
| --- | ---: | --- |
| visita → cadastro | 8% | ajustar promessa, prova e página do segmento |
| cadastro → 1ª proposta enviada | 50% | simplificar onboarding e acompanhar usuários |
| proposta criada → enviada | 70% | corrigir edição, PDF e envio |
| usuário com 2+ envios → pago | 15% | revisar limite, oferta e momento do upgrade |
| cancelamento mensal | abaixo de 8% no início | entrevistar cancelados e corrigir valor recorrente |

A métrica central é **contas que enviaram ao menos uma proposta nos últimos 30 dias**. Cadastro isolado não representa adoção.

## Canais de aquisição em ordem

1. **Venda assistida por WhatsApp e indicação:** maior aprendizado e menor desperdício no começo.
2. **Parcerias:** lojas de refrigeração, distribuidores de peças, contadores e associações de prestadores.
3. **Conteúdo e SEO por profissão:** páginas e exemplos de orçamento com intenção clara.
4. **Programa de indicação:** ativar apenas quando retenção e cobrança estiverem estáveis.
5. **Anúncios pagos:** começar com orçamento pequeno somente quando cadastro, ativação e pagamento forem mensurados de ponta a ponta.

## Gatilhos para escalar

### 10 clientes pagantes

- entrevistar todos os pagantes e pelo menos cinco usuários que não pagaram;
- escolher o segmento com maior ativação e repetição;
- instrumentar eventos de cadastro, início/fim da entrevista, envio, visualização, aceite e assinatura;
- criar suporte com prazo de resposta definido.

### 50 clientes pagantes

- reavaliar a capacidade da homologação e produção já separadas;
- ajustar filas e concorrência conforme o volume de PDF, e-mail e webhooks;
- revisar os alertas e a reconciliação existentes;
- repetir exercícios de recuperação e atualizar o atendimento;
- iniciar integração oficial com WhatsApp Cloud API em piloto fechado.

### 200 clientes pagantes

- adicionar templates por profissão com base em dados de uso, sem permitir que a IA invente preços;
- oferecer catálogo do prestador, itens frequentes e identidade visual;
- criar painel de receita, inadimplência, custo de IA/e-mail/PDF e margem por plano;
- contratar suporte antes de ampliar mídia paga.

### 1.000 clientes pagantes

- mover tarefas pesadas para filas e Workers separados;
- recalibrar os limites por conta e a proteção contra abuso existentes;
- introduzir plano Equipe somente após demanda comprovada;
- revisar arquitetura do banco, índices, retenção de eventos e estratégia de recuperação;
- acompanhar margem de contribuição, CAC recuperado, churn por coorte e disponibilidade por serviço.

## Integração futura com WhatsApp

Usar somente a API oficial do WhatsApp Business/Cloud API. A primeira versão deve receber uma solicitação, identificar o dono da conta pelo número, conduzir perguntas curtas com exemplos, salvar um rascunho e pedir confirmação explícita antes de criar e enviar a proposta. A IA extrai e organiza informações; regras do servidor calculam limites, valores e permissões. PDF e link são enviados após confirmação do usuário.

Cada mensagem recebida deve ser idempotente, entrar em uma fila e registrar estado da conversa. Templates aprovados são necessários para mensagens iniciadas fora da janela de atendimento. Custos por conversa, custo da IA e taxa de conclusão precisam entrar no cálculo de margem de cada plano antes de liberar o recurso para todos.
