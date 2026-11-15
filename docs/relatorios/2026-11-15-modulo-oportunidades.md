# Módulo de oportunidades

Data: 15/11/2026

Responsável: Pedro Henrique — [drexsi0](https://github.com/drexsi0)

## Resultado

Implementado o fluxo de publicação autenticada, catálogo por filtros fechados, detalhes e gerenciamento das próprias publicações. O backend identifica o autor pelo token e impede que outro usuário altere ou encerre uma oportunidade alheia.

| Método | Rota | Entrega |
| --- | --- | --- |
| POST | /api/oportunidades | Publicação vinculada ao autor autenticado |
| GET | /api/oportunidades | Catálogo de ativas, filtros e paginação |
| GET | /api/oportunidades/:id | Detalhes e disponibilidade |
| GET | /api/usuarios/me/oportunidades | Publicações e histórico do usuário |
| PATCH | /api/oportunidades/:id | Edição pelo autor |
| PATCH | /api/oportunidades/:id/encerrar | Encerramento pelo autor, sem exclusão |

## Regras e decisões

- Filtros combináveis por tipo (EMPREGO, ESTAGIO, PESQUISA, OUTRO) e modalidade (PRESENCIAL, HIBRIDO, REMOTO). Não há busca livre.
- Paginação com limite máximo de 50 e ordenação por data decrescente, com id como desempate.
- Novos campos: tipo, requisitos, email de contato, prazo de expiração e data de encerramento.
- Migration aditiva: registros anteriores recebem OUTRO e lista de requisitos vazia, preservando campos existentes e autoria.
- Estado calculado: ATIVA, EXPIRADA ou ENCERRADA. Encerramento tem precedência e preserva o histórico.
- Encerrar novamente preserva a primeira data. Publicações encerradas não podem ser editadas ou reabertas.
- Publicações expiradas podem ter o prazo renovado pelo autor. Não há cron nem exclusão definitiva.
- Os detalhes continuam acessíveis a usuários autenticados, inclusive quando indisponíveis; o frontend deve mostrar o estado e desabilitar as ações de candidatura nesses casos.
- Link HTTP/HTTPS e email de contato são opcionais. O backend não acessa o link nem envia emails.
- Campos desconhecidos, alteração de autoria e escolha de datas de auditoria pelo cliente são rejeitados.
- Identidade e papel do token agora são validados antes de preencher o usuário da requisição.
- Recuperação de senha permanece fora desta versão.

## Organização técnica e integração

Mantida a stack e a separação entre rotas, controllers, schemas e services. A configuração do Express foi separada da abertura da porta para permitir testes HTTP sem iniciar um servidor permanente.

O README e o [contrato da API](../api-oportunidades.md) documentam autenticação, campos, filtros, paginação, erros, exemplos e orientações para as telas. `Backend/oportunidades.http` contém requisições prontas.

O desenvolvimento continua local. Há uma configuração Docker Compose opcional para PostgreSQL 16 e um seed idempotente com conta e seis oportunidades fictícias. O seed exige autorização explícita por variável de ambiente, recusa produção, banco remoto e banco de testes e não sobrescreve registros já preparados.

Adicionado Biome como dependência de desenvolvimento para lint e formatação. O teste de tipos também verifica testes e seed. Os testes utilizam o runner nativo do Node.js, fetch, Prisma e PostgreSQL real; não foi adicionada uma plataforma de testes externa.

## Evidências de validação local

Ambiente: Windows, Node.js 22.17.0, Prisma 7.10.1 e PostgreSQL 16.14 em cluster temporário na porta 55432, fora da pasta do projeto. Não foram utilizados bancos ou dados preexistentes dos integrantes.

| Verificação | Resultado |
| --- | --- |
| Schema Prisma | Aprovado |
| Lint e formatação | Aprovados |
| Typecheck incluindo testes e seed | Aprovado |
| Build | Aprovado |
| Testes automatizados HTTP/PostgreSQL | 44 aprovados, sem falhas ou testes ignorados |
| Aplicação de migrations em banco vazio | Aprovada |
| Migration sobre oportunidade do modelo anterior | Preservou dados e aplicou os novos padrões |
| Criação de conta, login e perfil | Aprovados nos testes de integração |
| Autoria e bloqueio de alteração por outro usuário | Aprovados |
| Filtros, paginação, expiração e encerramento | Aprovados |
| Seed executado duas vezes | Seis publicações, sem duplicação |
| API compilada executada com Node.js | Login, conexão real, filtros e histórico aprovados |
| Preflight CORS para localhost:5173 | Aprovado |

O executor de testes exige TEST_DATABASE_URL local com nome terminado em _test e só aceita o parâmetro schema=public. O seed possui proteção equivalente. A suíte cria e remove apenas seus próprios dados; o teste de migration usa schema temporário dentro de uma transação revertida ao terminar.

O smoke test da API compilada consultou quatro oportunidades ativas e seis publicações no histórico da conta de demonstração, confirmando também o efeito idempotente do seed.

## GitHub Actions

O workflow `.github/workflows/backend.yml` instala pelo lockfile, verifica schema, lint, tipos e build e executa a suíte com PostgreSQL temporário em runner Linux. Não utiliza segredos do grupo. As ações de checkout e configuração de Node estão fixadas por SHA.

O workflow é acionado em PRs para main, atualizações da main e manualmente. O resultado de cada execução fica disponível nos checks do PR e no [histórico de Actions](https://github.com/WenderSD/oportuna/actions).

Não há deploy ou merge automático. Não foram alteradas permissões, regras de aprovação ou proteção de branch.

## Standards

A revisão identificou uma possibilidade de substituir o host do banco por parâmetro na URL de testes. Foi corrigida com uma lista explícita de parâmetros permitidos e testes de regressão, estendendo a proteção ao seed. Não ficaram achados conhecidos pendentes nesse eixo.

## Spec

A revisão de aderência ao contrato não identificou requisitos faltantes, comportamentos divergentes ou expansão indevida de escopo no módulo entregue.

Resumo da revisão: Standards, um achado corrigido; Spec, zero desvios identificados. A revisão complementa os testes e não equivale a uma auditoria exaustiva de segurança.

## Limites e próximo passo

As telas existentes ainda precisam ser conectadas à API pelo frontend. Não foi realizada validação de usabilidade no navegador, teste de carga, teste em banco compartilhado nem publicação na internet. O Docker Compose não foi executado neste computador; a validação local utilizou um PostgreSQL temporário com binários nativos. O workflow remoto fornece a verificação em Linux.

Migrations futuras devem ser novas, preservando a inicial e a desta entrega. Antes de aplicá-las a dados compartilhados, preparar backup. Para uma futura reversão da aplicação, a migration aditiva pode permanecer; não remover os novos campos de um banco com dados sem planejamento próprio.

Próximo passo: revisão do PR pelo grupo e integração das telas de publicação, catálogo, detalhes e perfil seguindo o contrato documentado.

## Mensagem para o grupo

Pessoal, concluí o módulo de oportunidades no backend: publicação com login, filtros por tipo e modalidade, detalhes, minhas publicações, edição e encerramento pelo autor. Incluí validações, migration preservando dados anteriores, exemplos para o frontend, dados fictícios e testes automatizados com PostgreSQL no GitHub Actions. Os 44 testes locais passaram. O README e o relatório estão atualizados no PR para revisão e integração das telas.
