import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { after, before, test } from "node:test";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

assert.equal(process.env.NODE_ENV, "test");
assert.equal(process.env.DATABASE_URL, process.env.TEST_DATABASE_URL);
assert.match(new URL(process.env.DATABASE_URL!).pathname, /_test$/);

const servidor = app.listen(0, "127.0.0.1");
const emails: string[] = [];
let base: string;
type Resposta = {
  mensagem: string;
  token?: string;
  usuario?: { id: string; nome: string; email: string; papel: string; senhaHash?: string };
  erros?: { campo: string; mensagem: string }[];
};

async function solicitar(path: string, body?: unknown, token?: string) {
  const resposta = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: resposta.status, body: (await resposta.json()) as Resposta };
}

function conta() {
  const email = `${randomUUID()}@example.test`;
  emails.push(email);
  return { nome: "Pessoa de teste", email, senha: "Senha-ficticia-123" };
}

before(async () => {
  await once(servidor, "listening");
  const endereco = servidor.address();
  assert.ok(endereco && typeof endereco === "object");
  base = `http://127.0.0.1:${endereco.port}/api/usuarios`;
});

after(async () => {
  try {
    await prisma.usuario.deleteMany({ where: { email: { in: emails } } });
  } finally {
    await prisma.$disconnect();
    await new Promise<void>((resolve, reject) =>
      servidor.close((erro) => (erro ? reject(erro) : resolve())),
    );
  }
});

test("cadastro normaliza nome e email e armazena somente hash", async () => {
  const dados = conta();
  const resposta = await solicitar("", {
    ...dados,
    nome: "  Pessoa de teste  ",
    email: ` ${dados.email.toUpperCase()} `,
    papel: "ADMINISTRADOR",
  });
  assert.equal(resposta.status, 201);
  assert.equal(resposta.body.usuario?.nome, dados.nome);
  assert.equal(resposta.body.usuario?.email, dados.email);
  assert.equal(resposta.body.usuario?.papel, "USUARIO");
  assert.equal(resposta.body.usuario?.senhaHash, undefined);
  const persistido = await prisma.usuario.findUniqueOrThrow({ where: { email: dados.email } });
  assert.notEqual(persistido.senhaHash, dados.senha);
  assert.ok(await bcrypt.compare(dados.senha, persistido.senhaHash));
});

test("cadastro repetido com outra capitalização retorna 409", async () => {
  const dados = conta();
  assert.equal((await solicitar("", dados)).status, 201);
  const repetido = await solicitar("", { ...dados, email: dados.email.toUpperCase() });
  assert.equal(repetido.status, 409);
  assert.deepEqual(repetido.body, { mensagem: "Este e-mail já está cadastrado." });
});

test("cadastros simultâneos retornam um sucesso e conflitos, sem erro 500", async () => {
  const dados = conta();
  const respostas = await Promise.all(Array.from({ length: 4 }, () => solicitar("", dados)));
  assert.deepEqual(respostas.map((r) => r.status).sort(), [201, 409, 409, 409]);
  assert.equal(await prisma.usuario.count({ where: { email: dados.email } }), 1);
  for (const resposta of respostas.filter((r) => r.status === 409))
    assert.equal(resposta.body.mensagem, "Este e-mail já está cadastrado.");
});

for (const [campo, valor] of [
  ["nome", " "],
  ["email", "invalido"],
  ["senha", "curta"],
  ["senha", "á".repeat(37)],
] as const) {
  test(`cadastro rejeita ${campo} inválido sem persistir`, async () => {
    const dados = conta();
    const resposta = await solicitar("", { ...dados, [campo]: valor });
    assert.equal(resposta.status, 400);
    assert.ok(resposta.body.erros?.some((erro) => erro.campo === campo));
    assert.equal(await prisma.usuario.count({ where: { email: dados.email } }), 0);
  });
}

test("login normaliza email e emite token válido sem expor hash", async () => {
  const dados = conta();
  await solicitar("", dados);
  const resposta = await solicitar("/login", {
    email: ` ${dados.email.toUpperCase()} `,
    senha: dados.senha,
  });
  assert.equal(resposta.status, 200);
  assert.ok(resposta.body.token);
  assert.equal(resposta.body.usuario?.senhaHash, undefined);
  const payload = jwt.verify(resposta.body.token, process.env.JWT_SECRET!) as jwt.JwtPayload;
  assert.equal(payload.sub, resposta.body.usuario?.id);
  assert.equal(payload.papel, "USUARIO");
  assert.ok(payload.exp! > payload.iat!);
  const perfil = await solicitar("/me", undefined, resposta.body.token);
  assert.equal(perfil.status, 200);
  assert.equal(perfil.body.usuario?.id, payload.sub);
  assert.equal(perfil.body.usuario?.senhaHash, undefined);
});

test("senha incorreta e email inexistente têm a mesma resposta 401", async () => {
  const dados = conta();
  await solicitar("", dados);
  const incorreta = await solicitar("/login", { email: dados.email, senha: "outra-senha" });
  const inexistente = await solicitar("/login", { email: conta().email, senha: dados.senha });
  assert.equal(incorreta.status, 401);
  assert.equal(inexistente.status, 401);
  assert.deepEqual(incorreta.body, inexistente.body);
});

for (const dados of [
  { email: "invalido", senha: "x" },
  { email: "pessoa@example.test", senha: "" },
  {},
]) {
  test(`login rejeita entrada inválida ${JSON.stringify(dados)}`, async () => {
    const resposta = await solicitar("/login", dados);
    assert.equal(resposta.status, 400);
    assert.ok(resposta.body.erros?.length);
  });
}

test("perfil sem token ou com token expirado retorna 401", async () => {
  assert.equal((await solicitar("/me")).status, 401);
  const token = jwt.sign({ papel: "USUARIO" }, process.env.JWT_SECRET!, {
    subject: randomUUID(),
    expiresIn: -1,
  });
  assert.equal((await solicitar("/me", undefined, token)).status, 401);
});

test("perfil inexistente mantém resposta 404 documentada", async () => {
  const token = jwt.sign({ papel: "USUARIO" }, process.env.JWT_SECRET!, { subject: randomUUID() });
  const resposta = await solicitar("/me", undefined, token);
  assert.equal(resposta.status, 404);
  assert.deepEqual(resposta.body, { mensagem: "Usuário não encontrado." });
});
