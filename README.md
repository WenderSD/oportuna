# OportUna

Plataforma desenvolvida para centralizar oportunidades de emprego, estágio e experiências profissionais dentro da comunidade acadêmica.

## Tecnologias utilizadas

### Frontend

- React
- Vite
- TypeScript

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT
- Zod
- Bcrypt

## Estrutura do projeto

```text
oportuna/
├── Frontend/
│   └── src/
├── Backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
└── README.md
```

## Pré-requisitos

- Node.js
- npm
- PostgreSQL

O backend foi desenvolvido para Node.js 22 e PostgreSQL 16.
O desenvolvimento continua local; não é necessário publicar a aplicação para integrar o frontend.

## Configuração do Backend

1. Acesse a pasta:

```bash
cd Backend
```

2. Instale as dependências:

```bash
npm ci
```

3. Crie um arquivo `.env` com base no `.env.example`.

4. Configure a conexão com o PostgreSQL.

5. Valide o schema e gere o Prisma Client:

```bash
npm run prisma:validate
npm run prisma:generate
```

6. Execute as migrations no banco de desenvolvimento configurado:

```bash
npm run db:migrate
```

7. Inicie o servidor em desenvolvimento:

```bash
npm run dev
```

Os comandos `dev`, `typecheck` e `build` geram o Prisma Client automaticamente.
O diretório `generated/prisma` não deve ser versionado.

### Verificação e execução compilada

```bash
npm run typecheck
npm run build
npm start
```

O build inclui os fontes da API e o cliente Prisma gerado em `dist`.
O comando `start` executa `dist/src/server.js` com Node.js, sem depender de `tsx`.
Antes de abrir a porta, a API valida `DATABASE_URL` (URL PostgreSQL), `JWT_SECRET` (não vazio),
`JWT_EXPIRES_IN` (duração positiva, padrão `1d`) e `PORT` (inteiro de 1 a 65535, padrão 3000).
Use uma chave JWT própria no ambiente local. Configuração inválida interrompe a inicialização
com uma mensagem sobre a variável, sem exibir sua senha ou chave.

Com o servidor iniciado, `GET http://localhost:3000/api/health` verifica a API.
`GET http://localhost:3000/api/health/db` verifica também a conexão com o PostgreSQL.
A validação do schema, a geração do cliente e a compilação não aplicam migrations.

### PostgreSQL local com Docker (opcional)

Quem já possui PostgreSQL local pode criar os bancos `oportuna_db` e `oportuna_test` diretamente.
Como alternativa, com Docker e Docker Compose instalados, execute na raiz do repositório.
No PowerShell, defina uma senha local no terminal e inicie o serviço:

```powershell
$env:POSTGRES_PASSWORD = 'ESCOLHA_UMA_SENHA_LOCAL'
docker compose up -d --wait
docker compose exec postgres createdb -U postgres oportuna_test
```

O comando `createdb` é necessário somente na primeira preparação do banco de testes.
Em Bash, use `export POSTGRES_PASSWORD='ESCOLHA_UMA_SENHA_LOCAL'` antes dos mesmos comandos Docker.
Em `Backend/.env`, configure a mesma senha nas URLs de desenvolvimento e teste.
Se a senha contiver caracteres especiais, codifique-os no componente de senha da URL.
O serviço fica acessível somente em localhost:5432 e mantém os dados em volume local.
`docker compose stop` interrompe o serviço preservando os dados. Não compartilhe senhas nem arquivos `.env`.

### Dados fictícios para integração

Após as migrations, defina `ALLOW_DEMO_SEED=true` no arquivo `Backend/.env` e execute dentro de `Backend`:

```bash
npm run db:seed
```

O seed exige banco local, recusa `NODE_ENV=production` e cria somente dados fictícios.
Também recusa bancos com nome terminado em `_test` e parâmetros de conexão adicionais ao schema public.
Conta: `demo@example.test`. Senha: `Demo-oportuna-123`.
São seis oportunidades para demonstrar os tipos, modalidades e estados.
Executar novamente não duplica os exemplos nem sobrescreve edições e encerramentos.
Depois de preparar os dados, volte `ALLOW_DEMO_SEED` para false.

### Testes automatizados e qualidade

Configure `TEST_DATABASE_URL` para um banco local exclusivo com nome terminado em `_test`.
O comando de testes substitui internamente `DATABASE_URL` por essa URL e usa uma chave JWT fictícia.
Ele recusa endereço remoto, banco sem sufixo `_test` e schema diferente de public.
Aplica as migrations nesse banco e testa a API por HTTP com PostgreSQL real.
Não aponte a URL de testes para um banco de demonstração ou para dados que deseja preservar.

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

`lint` usa Biome para verificar código e formatação; `npm run lint:fix` aplica os ajustes automáticos.
`typecheck` inclui os testes e o seed. `build` compila somente a API e seu cliente Prisma.
A suíte verifica publicação, filtros fechados, paginação, detalhes, autoria, edição, encerramento,
expiração, autenticação, validação e preservação de dados antigos pela migration.
Também cobre normalização de cadastro/login, armazenamento de hash, conflitos de email
inclusive simultâneos, credenciais incorretas e configuração inválida de inicialização.

O workflow [Backend](.github/workflows/backend.yml) executa as verificações em PRs para main,
em atualizações da main e por acionamento manual. Cada execução usa um PostgreSQL temporário,
sem credenciais ou dados dos integrantes. O workflow não faz deploy nem merge.
As permissões e regras de aprovação do repositório permanecem sob decisão do grupo.

## Integração com o frontend

O módulo possui publicação, catálogo de ativas, detalhes, minhas publicações, edição e encerramento.
Todas as rotas exigem o token do login. O autor é definido pelo backend.
A consulta usa filtros fechados por tipo e modalidade, sem busca livre.
Recuperação de senha permanece para uma versão posterior.

- [Contrato da API, campos, filtros, exemplos de respostas e erros](docs/api-oportunidades.md)
- [Requisições prontas para testar localmente](Backend/oportunidades.http)

O frontend acessa a API; somente o backend acessa PostgreSQL por Prisma.
Cada integrante mantém seu banco local, atualizado pelas migrations versionadas.
Após integrar alterações na main, atualize sua cópia, execute `npm ci` se o lockfile mudou,
aplique `npm run db:migrate` e reinicie a API. Não edite migrations já compartilhadas;
mudanças futuras devem gerar novas migrations. As telas atuais ainda precisam ser conectadas à API.

## Configuração do Frontend

1. Acesse a pasta:

```bash
cd Frontend
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie a aplicação:

```bash
npm run dev
```

## Status do desenvolvimento

Projeto em desenvolvimento.
