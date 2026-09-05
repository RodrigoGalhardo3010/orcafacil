# Estado verificado — 05/09/2026

## Escopo consolidado

OrçaFácil é um MVP de propostas comerciais para pequenos prestadores, com foco inicial em instaladores de ar-condicionado. Fluxo: cadastro, rascunho com itens, envio de link, visualização, aceite/recusa e acompanhamento. O pacote adota 3 envios gratuitos por mês e Pro de R$ 39,90/mês; as sugestões anteriores de outros planos não são funcionalidades contratadas ou validadas.

Stack: Nuxt 4, Cloudflare Workers, Supabase Auth/PostgreSQL, Mercado Pago Assinaturas e Resend. IA, equipes e PDF gerado no servidor ficam fora do MVP atual. Materiais de marketing e planilhas estão incluídos; nenhuma campanha foi executada nesta revisão.

## Origem e revisão

- Pacote original: `orcafacil-mvp.zip`, 52.204 bytes.
- SHA-256: `b3f3b76226f704cedced73a03d81a43e17229decd7a87e8c93fc0d67955a9475`.
- Histórico textual disponível da conversa “Site OrcaFacil” recuperado; afirmações anteriores não foram tratadas como prova de testes.
- Repositório remoto vazio na revisão inicial, sem README ou histórico a preservar; README do pacote mantido e atualizado.
- Dependências fixadas e lockfile incluído; configuração TypeScript e ferramenta de verificação adicionadas.
- Build para Cloudflare corrigido: e-mails HTML usam a API REST do Resend, evitando a dependência opcional de React do SDK. Referência: https://resend.com/docs/api-reference/emails/send-email.
- Webhook agora retorna 503 quando seu segredo não está configurado e rejeita assinaturas inválidas.
- Scanner de credenciais ampliado, inclusive para `.env.example`, JWTs, chaves privadas e arquivos indevidamente adicionados ao Git. O scanner não substitui revisão humana nem garante ausência de todo segredo possível.

## Supabase conferido, sem alterações remotas nesta revisão

- Projeto ativo e saudável.
- Histórico remoto confirma `20260905020917_initial_orcafacil_schema` e `20260905021014_harden_handle_new_user_permissions`.
- Arquivos locais alinhados a essas versões; a segunda migration estava ausente do ZIP.
- Advisor de segurança retornou somente avisos informativos de RLS sem policies nas cinco tabelas. Esse é o desenho atual: tabelas acessadas pelo backend, com privilégios diretos revogados para `anon` e `authenticated`.
- As credenciais do ambiente de execução ainda precisam ser configuradas. Nenhuma credencial real foi adicionada ao código.

## Bloqueios antes de produção

1. Tornar transacionais a edição de proposta/itens e a verificação do limite mensal; hoje requisições simultâneas podem ultrapassar o limite ou deixar dados parciais.
2. Impedir edição e reenvio que alterem propostas já respondidas; controlar validade e resposta concorrente de forma atômica. A interface também precisa usar o estado confirmado pelo servidor e abortar envio se o salvamento falhar.
3. Concluir robustez de cobrança: idempotência de checkout, tratamento de falhas de persistência, múltiplas assinaturas e ordenação de eventos; executar testes em sandbox do provedor.
4. Configurar ambiente de homologação, URLs de Auth, remetente de e-mail verificado e secrets. Testar cadastro, sessão, recuperação de senha, isolamento entre usuários e o fluxo completo de proposta com serviços reais.
5. Configurar hospedagem e domínio, proteção contra abuso, monitoramento e recuperação. Validar termos, privacidade e contato do operador antes de receber usuários reais.

O build aprovado não equivale a aprovação de produção. A publicação do código no GitHub é a primeira etapa; o deploy e as configurações serão conduzidos com o usuário, um passo por vez.

## Verificação reproduzível

`npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `npm run check:secrets`.
Os testes de integração usam respostas simuladas; não enviam e-mails nem efetuam cobranças. A auditoria de dependências de produção realizada nesta revisão não retornou vulnerabilidades conhecidas.
