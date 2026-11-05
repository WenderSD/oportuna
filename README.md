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
├── frontend/
│   └── src/
├── backend/
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
cd backend
```

2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` com base no `.env.example`.

4. Configure a conexão com o PostgreSQL.

5. Gere o Prisma Client:

```bash
npx prisma generate
```

6. Execute as migrations:

```bash
npx prisma migrate deploy
```

7. Inicie o servidor em desenvolvimento:

```bash
npm run dev
```

## Configuração do Frontend

1. Acesse a pasta:

```bash
cd frontend
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
