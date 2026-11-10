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

6. Execute as migrations:

```bash
npx prisma migrate deploy --config prisma7.config.ts
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
A variável `DATABASE_URL` deve estar definida para iniciar a API.

Com o servidor iniciado, `GET http://localhost:3000/api/health` verifica a API.
`GET http://localhost:3000/api/health/db` verifica também a conexão com o PostgreSQL.
A validação do schema, a geração do cliente e a compilação não aplicam migrations.

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
