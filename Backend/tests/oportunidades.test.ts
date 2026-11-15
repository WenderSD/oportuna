import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import type { Server } from "node:http";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import type { Oportunidade } from "../generated/prisma/client.js";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

assert.equal(process.env.NODE_ENV, "test", "Execute os testes por npm test.");
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
assert.match(new URL(process.env.DATABASE_URL!).pathname, /_test$/);

let servidor: Server;
let baseUrl: string;
let tokenAutor: string;
let tokenOutro: string;
let autorId: string;
let oportunidadeId: string;
const usuariosCriados: string[] = [];
const publicacao = {
  titulo: "Estágio em desenvolvimento",
  descricao: "Desenvolvimento de aplicações para a comunidade acadêmica.",
  empresa: "Empresa de demonstração",
  tipo: "ESTAGIO",
  modalidade: "REMOTO",
  requisitos: ["Estar cursando ensino superior"],
  linkCandidatura: "https://example.com/candidatura",
  emailContato: "vagas@example.com",
};

type OportunidadeResposta = Omit<
  Oportunidade,
  "criadoEm" | "atualizadoEm" | "expiraEm" | "encerradaEm"
> & {
  estado: string;
  criadoEm: string;
  atualizadoEm: string;
  expiraEm: string | null;
  encerradaEm: string | null;
  senhaHash?: unknown;
  autor?: unknown;
};
type RespostaOportunidade = {
  oportunidade: OportunidadeResposta;
  mensagem: string;
  erros?: { campo: string; mensagem: string }[];
};
type RespostaUsuario = {
  usuario: { id: string; senhaHash?: unknown };
  token: string;
};
type RespostaListagem = {
  oportunidades: OportunidadeResposta[];
  paginacao: { pagina: number; limite: number; total: number; totalPaginas: number };
};

async function requisicao<T = RespostaOportunidade>(
  caminho: string,
  token?: string,
  method = "GET",
  dados?: unknown,
) {
  const response = await fetch(`${baseUrl}${caminho}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(dados !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: dados === undefined ? undefined : JSON.stringify(dados),
  });
  return { status: response.status, body: (await response.json()) as T };
}

async function cadastrarEAutenticar() {
  const dados = {
    nome: "Pessoa de teste",
    email: `${randomUUID()}@example.test`,
    senha: "senha-ficticia-123",
  };
  const cadastro = await requisicao<RespostaUsuario>("/api/usuarios", undefined, "POST", dados);
  assert.equal(cadastro.status, 201);
  usuariosCriados.push(cadastro.body.usuario.id);
  assert.equal(cadastro.body.usuario.senhaHash, undefined);
  const login = await requisicao<RespostaUsuario>("/api/usuarios/login", undefined, "POST", {
    email: dados.email,
    senha: dados.senha,
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.usuario.senhaHash, undefined);
  return login.body;
}

before(async () => {
  servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const endereco = servidor.address();
  assert.ok(endereco && typeof endereco === "object");
  baseUrl = `http://127.0.0.1:${endereco.port}`;
  const autor = await cadastrarEAutenticar();
  const outro = await cadastrarEAutenticar();
  tokenAutor = autor.token;
  autorId = autor.usuario.id;
  tokenOutro = outro.token;
});

after(async () => {
  try {
    await prisma.oportunidade.deleteMany({ where: { autorId: { in: usuariosCriados } } });
    await prisma.usuario.deleteMany({ where: { id: { in: usuariosCriados } } });
  } finally {
    await prisma.$disconnect();
    if (servidor)
      await new Promise<void>((resolve, reject) =>
        servidor.close((erro) => (erro ? reject(erro) : resolve())),
      );
  }
});

test("migration preserva uma oportunidade anterior ao módulo", async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const schema = `migracao_${randomUUID().replaceAll("-", "")}`;
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET LOCAL search_path TO "${schema}"`);
    await client.query(
      await readFile(
        new URL("../prisma/migrations/20261029233428_init/migration.sql", import.meta.url),
        "utf8",
      ),
    );
    await client.query(
      'INSERT INTO "Usuario" (id, nome, email, "senhaHash", "atualizadoEm") VALUES ($1, $2, $3, $4, NOW())',
      ["autor-antigo", "Pessoa", "antigo@example.test", "hash-ficticio"],
    );
    await client.query(
      'INSERT INTO "Oportunidade" (id, titulo, descricao, empresa, "autorId", "atualizadoEm") VALUES ($1, $2, $3, $4, $5, NOW())',
      ["vaga-antiga", "Publicação anterior", "Descrição anterior", "Empresa", "autor-antigo"],
    );
    await client.query(
      await readFile(
        new URL(
          "../prisma/migrations/20261115170000_modulo_oportunidades/migration.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const { rows } = await client.query('SELECT * FROM "Oportunidade" WHERE id = $1', [
      "vaga-antiga",
    ]);
    assert.equal(rows[0].titulo, "Publicação anterior");
    assert.equal(rows[0].autorId, "autor-antigo");
    assert.equal(rows[0].tipo, "OUTRO");
    assert.deepEqual(rows[0].requisitos, []);
    assert.equal(rows[0].encerradaEm, null);
  } finally {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
});

test("perfil retorna somente os dados básicos do usuário autenticado", async () => {
  const resultado = await requisicao<RespostaUsuario>("/api/usuarios/me", tokenAutor);
  assert.equal(resultado.status, 200);
  assert.equal(resultado.body.usuario.id, autorId);
  assert.equal(resultado.body.usuario.senhaHash, undefined);
});

test("health do banco confirma conexão real com PostgreSQL", async () => {
  const resultado = await requisicao<{ status: string; database: string }>("/api/health/db");
  assert.equal(resultado.status, 200);
  assert.equal(resultado.body.database, "connected");
});

test("identidade sem usuário no banco não pode publicar", async () => {
  const token = jwt.sign({ papel: "USUARIO" }, process.env.JWT_SECRET!, { subject: randomUUID() });
  assert.equal((await requisicao("/api/oportunidades", token, "POST", publicacao)).status, 401);
});

test("todas as rotas de oportunidades exigem autenticação", async () => {
  for (const [method, caminho, dados] of [
    ["GET", "/api/oportunidades", undefined],
    ["GET", "/api/usuarios/me/oportunidades", undefined],
    ["GET", `/api/oportunidades/${randomUUID()}`, undefined],
    ["POST", "/api/oportunidades", publicacao],
    ["PATCH", `/api/oportunidades/${randomUUID()}`, { titulo: "Novo título" }],
    ["PATCH", `/api/oportunidades/${randomUUID()}/encerrar`, undefined],
  ] as const) {
    assert.equal((await requisicao(caminho, undefined, method, dados)).status, 401);
  }
});

test("tokens inválidos, expirados ou sem identidade não autorizam acesso", async () => {
  const tokens = [
    "invalido",
    jwt.sign({ papel: "USUARIO" }, process.env.JWT_SECRET!, { subject: autorId, expiresIn: -1 }),
    jwt.sign({ papel: "USUARIO" }, process.env.JWT_SECRET!),
    jwt.sign({ papel: "USUARIO" }, process.env.JWT_SECRET!, { subject: "nao-e-uuid" }),
    jwt.sign({ papel: "ADMIN_FALSO" }, process.env.JWT_SECRET!, { subject: autorId }),
    jwt.sign({ papel: "USUARIO" }, "outra-chave", { subject: autorId }),
  ];
  for (const token of tokens)
    assert.equal((await requisicao("/api/usuarios/me/oportunidades", token)).status, 401);
});

test("publicação válida persiste e vincula o autor ao token", async () => {
  const resultado = await requisicao("/api/oportunidades", tokenAutor, "POST", publicacao);
  assert.equal(resultado.status, 201);
  oportunidadeId = resultado.body.oportunidade.id;
  assert.equal(resultado.body.oportunidade.autorId, autorId);
  assert.equal(resultado.body.oportunidade.estado, "ATIVA");
  const persistida = await prisma.oportunidade.findUniqueOrThrow({ where: { id: oportunidadeId } });
  assert.equal(persistida.titulo, publicacao.titulo);
  assert.deepEqual(persistida.requisitos, publicacao.requisitos);
  assert.equal(persistida.autorId, autorId);
});

test("campos opcionais podem ser omitidos ou removidos com null", async () => {
  const resultado = await requisicao("/api/oportunidades", tokenAutor, "POST", {
    titulo: "Projeto de pesquisa",
    descricao: "Pesquisa acadêmica em equipe.",
    empresa: "Universidade",
    tipo: "PESQUISA",
    modalidade: "PRESENCIAL",
  });
  assert.equal(resultado.status, 201);
  assert.deepEqual(resultado.body.oportunidade.requisitos, []);
  assert.equal(resultado.body.oportunidade.linkCandidatura, null);
  const caminho = `/api/oportunidades/${resultado.body.oportunidade.id}`;
  assert.equal(
    (
      await requisicao(caminho, tokenAutor, "PATCH", {
        localizacao: "Campus",
        expiraEm: new Date(Date.now() + 86400000).toISOString(),
      })
    ).status,
    200,
  );
  const removida = await requisicao(caminho, tokenAutor, "PATCH", {
    localizacao: null,
    expiraEm: null,
  });
  assert.equal(removida.status, 200);
  assert.equal(removida.body.oportunidade.localizacao, null);
  assert.equal(removida.body.oportunidade.expiraEm, null);
});

for (const [nome, alteracao] of [
  ["título vazio", { titulo: " " }],
  ["descrição curta", { descricao: "curta" }],
  ["tipo desconhecido", { tipo: "QUALQUER" }],
  ["modalidade desconhecida", { modalidade: "ONLINE" }],
  ["link javascript", { linkCandidatura: "javascript:alert(1)" }],
  ["email inválido", { emailContato: "sem-email" }],
  ["prazo no passado", { expiraEm: "2020-01-01T00:00:00Z" }],
  ["requisito vazio", { requisitos: [" "] }],
  ["troca de autor", { autorId: randomUUID() }],
  ["id escolhido pelo cliente", { id: randomUUID() }],
  ["estado escolhido pelo cliente", { estado: "ATIVA" }],
] as const) {
  test(`publicação rejeita ${nome} sem gravar registro`, async () => {
    const antes = await prisma.oportunidade.count({ where: { autorId } });
    const resultado = await requisicao("/api/oportunidades", tokenAutor, "POST", {
      ...publicacao,
      ...alteracao,
    });
    assert.equal(resultado.status, 400);
    assert.ok(resultado.body.erros?.length);
    assert.equal(await prisma.oportunidade.count({ where: { autorId } }), antes);
  });
}

test("listagem combina filtros fechados e retorna paginação coerente", async () => {
  const resultado = await requisicao<RespostaListagem>(
    "/api/oportunidades?tipo=ESTAGIO&modalidade=REMOTO&limite=1",
    tokenAutor,
  );
  assert.equal(resultado.status, 200);
  assert.equal(resultado.body.oportunidades[0].id, oportunidadeId);
  assert.equal(resultado.body.paginacao.total, 1);
  const vazia = await requisicao<RespostaListagem>(
    "/api/oportunidades?tipo=ESTAGIO&modalidade=PRESENCIAL",
    tokenAutor,
  );
  assert.deepEqual(vazia.body.oportunidades, []);
  assert.equal(vazia.body.paginacao.totalPaginas, 0);
});

test("paginação desempata datas por id e não repete registros", async () => {
  const data = new Date();
  const oportunidades = await prisma.oportunidade.createManyAndReturn({
    data: [
      { ...publicacao, autorId, tipo: "OUTRO", modalidade: "REMOTO", criadoEm: data },
      { ...publicacao, autorId, tipo: "OUTRO", modalidade: "REMOTO", criadoEm: data },
    ],
  });
  const ids = oportunidades
    .map((vaga) => vaga.id)
    .sort()
    .reverse();
  const primeira = await requisicao<RespostaListagem>(
    "/api/oportunidades?tipo=OUTRO&limite=1",
    tokenAutor,
  );
  const segunda = await requisicao<RespostaListagem>(
    "/api/oportunidades?tipo=OUTRO&limite=1&pagina=2",
    tokenAutor,
  );
  assert.equal(primeira.body.oportunidades[0].id, ids[0]);
  assert.equal(segunda.body.oportunidades[0].id, ids[1]);
  assert.equal(primeira.body.paginacao.totalPaginas, 2);
  const fora = await requisicao<RespostaListagem>(
    "/api/oportunidades?tipo=OUTRO&pagina=3&limite=1",
    tokenAutor,
  );
  assert.deepEqual(fora.body.oportunidades, []);
});

for (const query of [
  "busca=tecnologia",
  "tipo=INEXISTENTE",
  "modalidade=ONLINE",
  "limite=51",
  "limite=0",
  "pagina=-1",
  "pagina=1.5",
  "pagina=10001",
  "tipo=ESTAGIO&tipo=EMPREGO",
  "estado=ENCERRADA",
]) {
  test(`listagem rejeita parâmetros inválidos: ${query}`, async () => {
    assert.equal((await requisicao(`/api/oportunidades?${query}`, tokenAutor)).status, 400);
  });
}

test("detalhes retornam dados públicos sem expor o cadastro do autor", async () => {
  const resultado = await requisicao(`/api/oportunidades/${oportunidadeId}`, tokenOutro);
  assert.equal(resultado.status, 200);
  assert.equal(resultado.body.oportunidade.emailContato, publicacao.emailContato);
  assert.equal(resultado.body.oportunidade.senhaHash, undefined);
  assert.equal(resultado.body.oportunidade.autor, undefined);
});

test("minhas publicações não incluem registros de outro autor", async () => {
  const outro = await requisicao("/api/oportunidades", tokenOutro, "POST", {
    ...publicacao,
    titulo: "Vaga de outro autor",
  });
  assert.equal(outro.status, 201);
  const minhas = await requisicao<RespostaListagem>("/api/usuarios/me/oportunidades", tokenAutor);
  assert.ok(minhas.body.oportunidades.length > 0);
  assert.ok(
    minhas.body.oportunidades.every((vaga: { autorId: string }) => vaga.autorId === autorId),
  );
  assert.equal(
    (
      await requisicao(
        `/api/usuarios/me/oportunidades?autorId=${outro.body.oportunidade.autorId}`,
        tokenAutor,
      )
    ).status,
    400,
  );
});

test("outro usuário não pode editar nem encerrar a publicação", async () => {
  const antes = await prisma.oportunidade.findUniqueOrThrow({ where: { id: oportunidadeId } });
  assert.equal(
    (
      await requisicao(`/api/oportunidades/${oportunidadeId}`, tokenOutro, "PATCH", {
        titulo: "Alteração indevida",
      })
    ).status,
    403,
  );
  assert.equal(
    (await requisicao(`/api/oportunidades/${oportunidadeId}/encerrar`, tokenOutro, "PATCH")).status,
    403,
  );
  const depois = await prisma.oportunidade.findUniqueOrThrow({ where: { id: oportunidadeId } });
  assert.equal(depois.titulo, antes.titulo);
  assert.equal(depois.encerradaEm, null);
});

test("autor edita campos permitidos e mantém autoria", async () => {
  const caminho = `/api/oportunidades/${oportunidadeId}`;
  const resultado = await requisicao(caminho, tokenAutor, "PATCH", {
    titulo: "Estágio atualizado",
    emailContato: "NOVO@EXAMPLE.COM",
  });
  assert.equal(resultado.status, 200);
  assert.equal(resultado.body.oportunidade.titulo, "Estágio atualizado");
  assert.equal(resultado.body.oportunidade.emailContato, "novo@example.com");
  assert.equal(resultado.body.oportunidade.autorId, autorId);
  assert.equal((await requisicao(caminho, tokenAutor, "PATCH", {})).status, 400);
  assert.equal(
    (await requisicao(caminho, tokenAutor, "PATCH", { autorId: randomUUID() })).status,
    400,
  );
});

test("UUID inválido retorna 400 e recurso inexistente retorna 404", async () => {
  assert.equal((await requisicao("/api/oportunidades/invalido", tokenAutor)).status, 400);
  for (const [method, sufixo, dados] of [
    ["GET", "", undefined],
    ["PATCH", "", { titulo: "Novo título" }],
    ["PATCH", "/encerrar", undefined],
  ] as const) {
    assert.equal(
      (await requisicao(`/api/oportunidades/${randomUUID()}${sufixo}`, tokenAutor, method, dados))
        .status,
      404,
    );
  }
});

test("expiração retira do catálogo e preserva histórico do autor", async () => {
  const expirada = await prisma.oportunidade.create({
    data: {
      ...publicacao,
      autorId,
      tipo: "ESTAGIO",
      modalidade: "REMOTO",
      expiraEm: new Date(Date.now() - 1000),
    },
  });
  const catalogo = await requisicao<RespostaListagem>("/api/oportunidades", tokenAutor);
  assert.ok(catalogo.body.oportunidades.every((vaga: { id: string }) => vaga.id !== expirada.id));
  const minhas = await requisicao<RespostaListagem>(
    "/api/usuarios/me/oportunidades?estado=EXPIRADA",
    tokenAutor,
  );
  assert.equal(minhas.body.oportunidades[0].id, expirada.id);
  assert.equal(minhas.body.oportunidades[0].estado, "EXPIRADA");
  assert.equal(
    (await requisicao(`/api/oportunidades/${expirada.id}`, tokenAutor)).body.oportunidade.estado,
    "EXPIRADA",
  );
});

test("encerramento é idempotente, preserva histórico e impede edição", async () => {
  const caminho = `/api/oportunidades/${oportunidadeId}`;
  const primeira = await requisicao(`${caminho}/encerrar`, tokenAutor, "PATCH");
  assert.equal(primeira.status, 200);
  assert.equal(primeira.body.oportunidade.estado, "ENCERRADA");
  const repetida = await requisicao(`${caminho}/encerrar`, tokenAutor, "PATCH", {});
  assert.equal(repetida.body.oportunidade.encerradaEm, primeira.body.oportunidade.encerradaEm);
  assert.equal(
    (await requisicao(caminho, tokenAutor, "PATCH", { titulo: "Tentativa após encerrar" })).status,
    409,
  );
  const catalogo = await requisicao<RespostaListagem>("/api/oportunidades", tokenAutor);
  assert.ok(
    catalogo.body.oportunidades.every((vaga: { id: string }) => vaga.id !== oportunidadeId),
  );
  const minhas = await requisicao<RespostaListagem>(
    "/api/usuarios/me/oportunidades?estado=ENCERRADA",
    tokenAutor,
  );
  assert.ok(minhas.body.oportunidades.some((vaga: { id: string }) => vaga.id === oportunidadeId));
});

test("encerramento não aceita campos de edição no corpo", async () => {
  assert.equal(
    (
      await requisicao(`/api/oportunidades/${oportunidadeId}/encerrar`, tokenAutor, "PATCH", {
        titulo: "Tentativa",
      })
    ).status,
    400,
  );
});

test("autor pode renovar oportunidade expirada e voltar ao catálogo", async () => {
  const expirada = await prisma.oportunidade.create({
    data: {
      ...publicacao,
      autorId,
      tipo: "ESTAGIO",
      modalidade: "REMOTO",
      expiraEm: new Date(Date.now() - 1000),
    },
  });
  const resultado = await requisicao(`/api/oportunidades/${expirada.id}`, tokenAutor, "PATCH", {
    expiraEm: new Date(Date.now() + 86400000).toISOString(),
  });
  assert.equal(resultado.status, 200);
  assert.equal(resultado.body.oportunidade.estado, "ATIVA");
  const minhas = await requisicao<RespostaListagem>(
    "/api/usuarios/me/oportunidades?estado=ATIVA",
    tokenAutor,
  );
  assert.ok(minhas.body.oportunidades.some((vaga) => vaga.id === expirada.id));
  assert.ok(minhas.body.oportunidades.every((vaga) => vaga.estado === "ATIVA"));
});

test("JSON malformado retorna erro padronizado", async () => {
  const response = await fetch(`${baseUrl}/api/oportunidades`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenAutor}`, "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(response.status, 400);
  assert.equal(((await response.json()) as RespostaOportunidade).mensagem, "JSON inválido.");
});

test("corpo acima do limite retorna 413 sem detalhes internos", async () => {
  const resultado = await requisicao("/api/oportunidades", tokenAutor, "POST", {
    ...publicacao,
    descricao: "x".repeat(110000),
  });
  assert.equal(resultado.status, 413);
  assert.equal(resultado.body.mensagem, "O corpo da requisição excede o limite de 100 KB.");
});

test("executor recusa banco remoto, schema alternativo ou nome sem sufixo de testes", () => {
  for (const url of [
    "postgresql://p:p@database.example/oportuna_test",
    "postgresql://p:p@127.0.0.1/oportuna_db",
    "postgresql://p:p@127.0.0.1/oportuna_test?schema=outro",
    "http://127.0.0.1/oportuna_test",
    "postgresql://p:p@127.0.0.1/oportuna_test?host=database.example",
    "postgresql://p:p@127.0.0.1/oportuna_test?options=-csearch_path=outro",
    "postgresql://p:p@127.0.0.1/oportuna_test?schema=public&schema=public",
  ]) {
    const resultado = spawnSync(process.execPath, ["scripts/test.mjs"], {
      env: { ...process.env, TEST_DATABASE_URL: url },
      encoding: "utf8",
    });
    assert.equal(resultado.status, 1);
    assert.match(resultado.stderr, /banco de testes deve ser local/);
  }
});

test("seed recusa banco de testes e parâmetros que substituem o host", () => {
  for (const url of [
    "postgresql://p:p@127.0.0.1/oportuna_db?host=database.example",
    "postgresql://p:p@127.0.0.1/oportuna_%74est",
    process.env.TEST_DATABASE_URL!,
  ]) {
    const resultado = spawnSync(process.execPath, ["--import", "tsx", "prisma/seed.ts"], {
      env: { ...process.env, DATABASE_URL: url, ALLOW_DEMO_SEED: "true" },
      encoding: "utf8",
    });
    assert.equal(resultado.status, 1);
    assert.match(resultado.stderr, /use um banco local/);
  }
});
