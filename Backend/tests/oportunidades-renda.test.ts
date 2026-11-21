import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import type { Server } from "node:http";
import { after, before, test } from "node:test";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

assert.equal(process.env.NODE_ENV, "test", "Execute os testes por npm test.");
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
assert.match(new URL(process.env.DATABASE_URL!).pathname, /_test$/);

type Oportunidade = { id: string; titulo: string; renda: string | null };
type Resposta = {
  erros?: { campo: string; mensagem: string }[];
  oportunidade?: Oportunidade;
  oportunidades?: Oportunidade[];
};

let servidor: Server;
let baseUrl: string;
let token: string;
const usuariosCriados: string[] = [];

const publicacao = {
  titulo: "Estágio em desenvolvimento",
  descricao: "Desenvolvimento de aplicações para a comunidade acadêmica.",
  empresa: "Empresa de demonstração",
  tipo: "ESTAGIO",
  modalidade: "REMOTO",
};

async function requisicao(caminho: string, metodo = "GET", dados?: unknown) {
  const resposta = await fetch(`${baseUrl}${caminho}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(dados !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: dados === undefined ? undefined : JSON.stringify(dados),
  });
  return { status: resposta.status, body: (await resposta.json()) as Resposta };
}

async function publicar(extras: Record<string, unknown> = {}) {
  return requisicao("/api/oportunidades", "POST", { ...publicacao, ...extras });
}

before(async () => {
  servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const endereco = servidor.address();
  assert.ok(endereco && typeof endereco === "object");
  baseUrl = `http://127.0.0.1:${endereco.port}`;

  const credenciais = {
    nome: "Pessoa de teste",
    email: `${randomUUID()}@example.test`,
    senha: "senha-ficticia-123",
  };
  const cadastro = await fetch(`${baseUrl}/api/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credenciais),
  });
  assert.equal(cadastro.status, 201);
  const { usuario } = (await cadastro.json()) as { usuario: { id: string } };
  usuariosCriados.push(usuario.id);

  const login = await fetch(`${baseUrl}/api/usuarios/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: credenciais.email, senha: credenciais.senha }),
  });
  assert.equal(login.status, 200);
  token = ((await login.json()) as { token: string }).token;
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

test("renda é salva e aparece nos detalhes e nos cards da listagem", async () => {
  const criada = await publicar({ renda: "Bolsa-auxílio de R$ 1.200,00" });
  assert.equal(criada.status, 201);
  assert.equal(criada.body.oportunidade?.renda, "Bolsa-auxílio de R$ 1.200,00");
  const id = criada.body.oportunidade?.id;

  const detalhes = await requisicao(`/api/oportunidades/${id}`);
  assert.equal(detalhes.body.oportunidade?.renda, "Bolsa-auxílio de R$ 1.200,00");

  const minhas = await requisicao("/api/usuarios/me/oportunidades?limite=50");
  const card = minhas.body.oportunidades?.find((item) => item.id === id);
  assert.equal(card?.renda, "Bolsa-auxílio de R$ 1.200,00");
});

test("renda é opcional e retorna null quando omitida", async () => {
  const criada = await publicar();
  assert.equal(criada.status, 201);
  assert.equal(criada.body.oportunidade?.renda, null);
});

test("renda aceita texto livre e rejeita valores curtos ou longos demais", async () => {
  for (const renda of ["A combinar", "R$ 1.500,00", "Bolsa de R$ 800 + vale-transporte"]) {
    const valida = await publicar({ renda });
    assert.equal(valida.status, 201, `deveria aceitar ${renda}`);
    assert.equal(valida.body.oportunidade?.renda, renda);
  }

  for (const renda of ["a", "x".repeat(101), ""]) {
    const invalida = await publicar({ renda });
    assert.equal(invalida.status, 400);
    assert.equal(invalida.body.erros?.[0]?.campo, "renda");
  }
});

test("autor altera e remove a renda na edição", async () => {
  const criada = await publicar({ renda: "A combinar" });
  const id = criada.body.oportunidade?.id;

  const alterada = await requisicao(`/api/oportunidades/${id}`, "PATCH", { renda: "R$ 2.000,00" });
  assert.equal(alterada.status, 200);
  assert.equal(alterada.body.oportunidade?.renda, "R$ 2.000,00");

  const removida = await requisicao(`/api/oportunidades/${id}`, "PATCH", { renda: null });
  assert.equal(removida.status, 200);
  assert.equal(removida.body.oportunidade?.renda, null);
});
