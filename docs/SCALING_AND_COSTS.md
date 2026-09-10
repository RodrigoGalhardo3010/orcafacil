# Escalonamento, capacidade e custos

Atualizado em 10/09/2026. Preços e limites devem ser conferidos novamente antes de cada contratação.

## Decisão para o lançamento

O staging pode continuar nos planos gratuitos. A produção comercial deve começar com:

- **Supabase Pro para o banco de produção**: reduz o risco de pausa por inatividade, oferece mais capacidade e melhora as opções de suporte e recuperação;
- **Cloudflare Workers Paid**: o Worker gratuito limita CPU a 10 ms por requisição, um limite apertado para Nuxt SSR e geração de PDF. O plano pago começa em US$ 5/mês e inclui 10 milhões de requisições e 30 milhões de ms de CPU por mês;
- **Resend Free no beta assistido**: pode permanecer gratuito enquanto o consumo ficar abaixo de 70 e-mails por dia e 2.100 por mês, mantendo margem sobre os limites oficiais de 100/dia e 3.000/mês;
- **DeepSeek pré-pago com teto de uso**: usar o modelo Flash, registrar tokens por conta e manter saldo limitado com alertas;
- **Mercado Pago por transação**: acompanhar taxa efetiva, pagamentos recusados, estornos e receita líquida por plano.

Produção e staging devem usar projetos, credenciais e webhooks separados. Antes de contratar Supabase Pro, conferir se os dois projetos estão na mesma organização, pois o plano vale para a organização e cada projeto possui compute próprio.

## Papel da VPS Hostinger

A VPS existente deve entrar como capacidade complementar. Não é recomendável mover, antes do lançamento, o Nuxt, o banco, a autenticação e os webhooks de pagamento para uma única máquina. Essa mudança aumenta o tempo até a produção e transforma a VPS em um ponto único de falha, além de transferir para a operação do OrçaFácil a responsabilidade por atualizações do sistema, firewall, TLS, monitoramento, backup, restauração e resposta a incidentes.

Arquitetura recomendada para o lançamento:

- Cloudflare continua na borda e executa o site, a API e os webhooks críticos;
- Supabase gerenciado continua responsável por autenticação e Postgres;
- Resend, DeepSeek e Mercado Pago continuam como serviços gerenciados;
- a VPS fica preparada para tarefas assíncronas quando o volume justificar.

Primeiros usos adequados para a VPS:

- consumidores de filas para WhatsApp, PDF e e-mail;
- tarefas agendadas de conciliação e manutenção;
- monitoramento externo e exportações de backup criptografadas;
- processamento pesado que ultrapasse os limites de CPU do Cloudflare.

O sistema web e a confirmação de pagamentos devem continuar funcionando se a VPS ficar indisponível. Cada tarefa enviada à VPS precisa ser idempotente, persistida em fila, ter retentativa e poder ser retomada sem duplicar e-mail, PDF, proposta ou cobrança.

Antes de colocar qualquer carga real na VPS:

1. identificar plano, CPU, memória, disco, sistema operacional e serviços já instalados;
2. atualizar o sistema e usar acesso SSH por chave, com login por senha e acesso direto de root desativados;
3. restringir o firewall aos serviços necessários e limitar o SSH por origem quando viável;
4. executar aplicações com usuário sem privilégios e isolamento por contêiner;
5. enviar backups para outro provedor e testar a restauração;
6. monitorar CPU, memória, disco, fila, reinícios, certificados e disponibilidade;
7. manter segredos fora das imagens, do repositório e dos logs.

### Capacidade e expansão da VPS

A Hostinger oferece aumento vertical por faixas KVM. Na consulta de 10/09/2026, as configurações publicadas eram:

| Plano | vCPU | RAM | NVMe | Tráfego |
| --- | ---: | ---: | ---: | ---: |
| KVM 1 | 1 | 4 GB | 50 GB | 4 TB |
| KVM 2 | 2 | 8 GB | 100 GB | 8 TB |
| KVM 4 | 4 | 16 GB | 200 GB | 16 TB |

Os preços promocionais e de renovação variam. O plano e as condições de upgrade da conta devem ser confirmados no hPanel antes da contratação. Aumentar CPU e memória melhora a capacidade, mas não cria alta disponibilidade: uma única VPS continua sendo uma única zona de falha.

Planejar upgrade quando CPU permanecer acima de 60%, memória acima de 70%, disco acima de 70% ou quando a latência da fila ultrapassar o prazo operacional por 15 minutos. Em escala maior, usar pelo menos duas instâncias para os processadores assíncronos e manter banco, arquivos e fila em serviços resistentes à perda de uma máquina.

## Estado atual verificado

A organização Supabase RodrigoGalhardo3010's Org contém dois projetos nano:

- orcafacil-staging;
- RodrigoGalhardo3010's Project, usado em produção.

Uso observado em 10/09/2026:

- banco: 26 MB de 500 MB;
- usuários ativos no mês: 2 de 50.000;
- egress: 0,00 GB de 5 GB;
- arquivos: 0 GB de 1 GB.

Decisão para ganhar velocidade: manter os dois projetos na mesma organização ao lançar, aceitar o compute adicional do staging e reservar cerca de US$ 35/mês para o Supabase. Depois da estabilização, avaliar mover ou recriar o staging em uma organização gratuita separada. Uma transferência antes do lançamento adicionaria risco e não resolve uma limitação de capacidade atual.

## Orçamento inicial de infraestrutura

Reserva mensal sugerida para o beta:

| Serviço | Previsão inicial |
| --- | ---: |
| Supabase de produção | US$ 25–35 + impostos |
| Cloudflare Workers Paid | a partir de US$ 5 |
| Resend | US$ 0 enquanto respeitar a margem da cota |
| DeepSeek | US$ 5 de saldo controlado para iniciar |
| Mercado Pago | taxa variável descontada das cobranças |
| Domínio | custo anual do registrador escolhido |

Planejar inicialmente **US$ 35–45 por mês**, além de domínio, impostos e taxas do Mercado Pago. O valor do Supabase pode crescer se staging e produção estiverem na mesma organização paga, pois cada projeto usa compute próprio.

## Faixas de crescimento

### Faixa 0 — homologação

Equipe interna, contas de teste e nenhum cliente pagante.

- manter staging em contas gratuitas;
- usar apenas credenciais de teste do Mercado Pago;
- executar testes de compra, cancelamento, PDF, e-mail e restauração;
- não divulgar o staging como serviço disponível.

### Faixa 1 — beta comercial

Até 20 clientes pagantes e até 40 propostas enviadas por dia.

- Supabase de produção no Pro;
- Cloudflare Workers Paid;
- Resend Free com domínio verificado e alertas em 50%, 70% e 85% da cota;
- limite de IA por conta e por IP;
- monitoramento diário de erros, latência, banco, e-mail, IA e cobrança;
- atendimento direto aos primeiros clientes.

O objetivo é provar que os usuários criam uma segunda proposta e continuam usando o produto.

### Faixa 2 — tração

Gatilho: mais de 20 clientes pagantes, mais de 40 propostas/dia ou projeção acima de 2.100 e-mails/mês.

- migrar Resend para Pro antes da cota gratuita; o plano inicial publicado custa US$ 20/mês para 50.000 e-mails;
- processar PDF e e-mail por fila, com retentativas e fila de falhas;
- gravar um snapshot imutável da proposta enviada e reutilizar o PDF;
- configurar limites de gasto do Supabase e do Cloudflare;
- executar teste de carga em staging;
- revisar índices e consultas lentas mensalmente.

### Faixa 3 — crescimento

Gatilho: mais de 200 clientes pagantes, picos acima de 10 propostas por minuto ou uso sustentado acima de 60% de CPU, conexões ou armazenamento do banco.

- aumentar o compute do Supabase com base nas métricas;
- habilitar PITR antes de o banco chegar a 4 GB ou antes, conforme o RPO definido;
- separar processamento assíncrono de e-mail, PDF e IA do Worker web;
- armazenar PDFs enviados em objeto privado com URL temporária se a regeneração consumir CPU relevante;
- manter webhooks idempotentes e executar conciliação agendada de pagamentos;
- estabelecer runbooks e metas de recuperação.

### Faixa 4 — escala

Milhares de clientes pagantes, campanhas com picos previsíveis ou requisitos empresariais de disponibilidade.

- avaliar réplica de leitura somente quando as métricas mostrarem pressão;
- particionar ou arquivar eventos históricos conforme o crescimento real;
- usar filas separadas para pagamentos, propostas, e-mails e IA;
- contratar suporte e SLA adequados;
- executar testes periódicos de restauração e recuperação de incidentes;
- reavaliar os preços usando margem por cliente e custo por proposta.

## Proteção contra custo e abuso

Antes de abrir o cadastro ao público:

1. limitar cadastro, login, recuperação de senha e resposta pública por IP;
2. limitar chamadas de IA por usuário e por proposta;
3. limitar tamanho das mensagens, rodadas e tempo de execução da IA;
4. usar idempotência em envio, checkout, webhooks e PDF;
5. impedir edição de uma proposta respondida e preservar o conteúdo aceito;
6. configurar CAPTCHA nos fluxos de autenticação expostos;
7. alertar em 50%, 70% e 85% de cada cota e bloquear funções não essenciais perto do limite;
8. nunca bloquear confirmação de pagamento, cancelamento ou acesso a dados por causa de cota de IA.

Limites sugeridos para o primeiro beta:

| Recurso | Grátis | Essencial | Pro |
| --- | ---: | ---: | ---: |
| Propostas enviadas/mês | 3 | 25 | ilimitadas comercialmente |
| Mensagens de IA/mês | 30 | 250 | 1.000 |
| Rodadas de IA por proposta | 20 | 20 | 20 |
| Reenvios da mesma proposta/dia | 3 | 5 | 10 |

“Ilimitado” no Pro significa ausência de limite comercial de propostas, sujeito a uso aceitável, proteção contra automação abusiva e limites técnicos documentados nos Termos.

## Indicadores e gatilhos

### Cloudflare

- acompanhar requisições, CPU, erros 5xx e latência p95;
- alertar com CPU p95 acima de 20 ms ou erro acima de 1%;
- revisar custo ao projetar mais de 8 milhões de requisições/mês.

### Supabase

- acompanhar tamanho do banco, egress, usuários ativos, CPU, memória, conexões e consultas lentas;
- alertar com qualquer recurso acima de 60% por 15 minutos;
- planejar expansão em 70% e executar antes de 85%;
- no Free, o banco entra em modo somente leitura ao superar 500 MB; no Pro há 8 GB de disco incluído por projeto.

### Resend

- acompanhar enviados, entregues, rejeitados, bounces e reclamações;
- migrar antes de 70 e-mails/dia ou 2.100/mês;
- manter bounce abaixo de 4% e aplicar supressão automática;
- usar fila quando houver picos próximos ao limite inicial de 5 requisições por segundo.

### DeepSeek

- acompanhar tokens, custo por proposta, tempo, erros e rodadas;
- usar deepseek-flash e respostas estruturadas;
- interromper perguntas quando o orçamento estiver completo;
- alertar quando IA superar 10% da receita líquida da conta;
- reduzir contexto, resumir histórico e reutilizar os dados estruturados.

### Mercado Pago

- acompanhar assinaturas, aprovações, recusas, webhooks atrasados, estornos e cancelamentos;
- conciliar diariamente assinaturas e pagamentos;
- alertar quando um pagamento aprovado não ativar o plano em cinco minutos;
- calcular receita líquida após taxas e estornos por plano.

## Continuidade e segurança

- backup diário e teste trimestral de restauração;
- MFA obrigatório nas contas administrativas;
- duas pessoas com acesso de proprietário quando houver operação contínua;
- rotação de credenciais após incidente e em calendário definido;
- deploy versionado com rollback conhecido;
- logs sem tokens, dados de cartão ou conteúdo sensível;
- política de retenção e exclusão para dados pessoais e PDFs.

## Unidade econômica

O Essencial recebe no máximo R$ 19,90 para até 25 propostas. Quando todo o limite é usado, a receita bruta por proposta é R$ 0,796. O Pro precisa ser acompanhado por uso real, pois o volume não tem limite comercial.

Calcular mensalmente:

**margem por cliente = mensalidade - taxa do Mercado Pago - IA - e-mail - infraestrutura rateada - suporte**

Se um cliente Pro gerar custo incompatível com R$ 39,90, aplicar a política de uso aceitável, otimizar o processamento e revisar o preço para novos contratos antes de ampliar o marketing.

## Referências oficiais consultadas

- [Checklist de produção do Supabase](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Cobrança e cotas do Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Controle de custos do Supabase](https://supabase.com/docs/guides/platform/cost-control)
- [Preços do Cloudflare Workers](https://developers.cloudflare.com/workers/platform/pricing/)
- [Limites do Cloudflare Workers](https://developers.cloudflare.com/workers/platform/limits/)
- [Preços do Resend](https://resend.com/docs/knowledge-base/what-is-resend-pricing)
- [Cotas e limites do Resend](https://resend.com/docs/knowledge-base/account-quotas-and-limits)
- [Preços do DeepSeek](https://api-docs.deepseek.com/quick_start/pricing/)
- [Planos de VPS da Hostinger](https://www.hostinger.com/br/servidor-vps)
- [Responsabilidades ao hospedar o Supabase por conta própria](https://supabase.com/docs/guides/self-hosting)
- [Modelo de responsabilidade compartilhada do Supabase](https://supabase.com/docs/guides/deployment/shared-responsibility-model)
- [Backups do banco no Supabase](https://supabase.com/docs/guides/platform/backups)
