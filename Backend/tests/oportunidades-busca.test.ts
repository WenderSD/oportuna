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

type Oportunidade = { id: string; estado: string };
type Resposta = {
  erros?: { campo: string; mensagem: string }[];
  oportunidade?: Oportunidade;
  oportunidades?: Oportunidade[];
  paginacao?: { total: number; totalPaginas: number };
};

let servidor: Server;
let baseUrl: string;
let tokenAutor: string;
let tokenOutro: string;
const usuariosCriados: string[] = [];

const publicacaoBase = {
  titulo: "Vaga de demonstração",
  descricao: "Descrição genérica da oportunidade de demonstração.",
  empresa: "Empresa de demonstração",
  tipo: "OUTRO",
  modalidade: "PRESENCIAL",
};

// Palavra única por teste: evita misturar com qualquer outro dado do banco.
const marca = () => `zq${randomUUID().replaceAll("-", "").slice(0, 12)}`;

async function requisicao(caminho: string, token: string, metodo = "GET", dados?: unknown) {
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

async function publicar(extras: Record<string, unknown>, token = tokenAutor) {
  const resposta = await requisicao("/api/oportunidades", token, "POST", {
    ...publicacaoBase,
    ...extras,
  });
  assert.equal(resposta.status, 201);
  return resposta.body.oportunidade!.id;
}

async function buscar(busca: string, extra = "", token = tokenAutor) {
  const caminho = `/api/oportunidades?busca=${encodeURIComponent(busca)}${extra}`;
  const resposta = await requisicao(caminho, token);
  assert.equal(resposta.status, 200);
  return resposta.body;
}

async function cadastrarEAutenticar() {
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
  return ((await login.json()) as { token: string }).token;
}

before(async () => {
  servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  const endereco = servidor.address();
  assert.ok(endereco && typeof endereco === "object");
  baseUrl = `http://127.0.0.1:${endereco.port}`;
  tokenAutor = await cadastrarEAutenticar();
  tokenOutro = await cadastrarEAutenticar();
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

test("encontra a palavra no título, empresa, descrição, localização e requisitos", async () => {
  const campos = {
    titulo: marca(),
    empresa: marca(),
    descricao: marca(),
    localizacao: marca(),
    requisitos: marca(),
  };
  const ids = {
    titulo: await publicar({ titulo: `Vaga ${campos.titulo}` }),
    empresa: await publicar({ empresa: `Empresa ${campos.empresa}` }),
    descricao: await publicar({ descricao: `Texto longo com ${campos.descricao} no meio.` }),
    localizacao: await publicar({ localizacao: `Cidade ${campos.localizacao}` }),
    requisitos: await publicar({ requisitos: [campos.requisitos] }),
  };

  for (const campo of Object.keys(campos) as (keyof typeof campos)[]) {
    const resultado = await buscar(campos[campo]);
    assert.deepEqual(
      resultado.oportunidades?.map((item) => item.id),
      [ids[campo]],
      `a busca no campo ${campo} deveria achar só a publicação dele`,
    );
    assert.equal(resultado.paginacao?.total, 1);
  }
});

test("ignora maiúsculas e minúsculas e aceita parte da palavra", async () => {
  const palavra = marca();
  const id = await publicar({ titulo: `Analista ${palavra}`, requisitos: [palavra] });

  assert.deepEqual(
    (await buscar(palavra.toUpperCase())).oportunidades?.map((item) => item.id),
    [id],
  );
  assert.deepEqual(
    (await buscar(palavra.slice(0, 8))).oportunidades?.map((item) => item.id),
    [id],
  );
});

test("com várias palavras, todas precisam aparecer", async () => {
  const primeira = marca();
  const segunda = marca();
  const completa = await publicar({ titulo: `Vaga ${primeira}`, descricao: `Pede ${segunda}.` });
  await publicar({ titulo: `Outra ${primeira}` });

  const juntas = await buscar(`${primeira} ${segunda}`);
  assert.deepEqual(
    juntas.oportunidades?.map((item) => item.id),
    [completa],
  );
  assert.equal((await buscar(primeira)).paginacao?.total, 2);
  assert.equal((await buscar(`${primeira} naoexisteemnenhumlugar`)).paginacao?.total, 0);
});

test("rótulos de tipo e modalidade funcionam como palavras, com ou sem acento", async () => {
  const palavra = marca();
  const id = await publicar({
    titulo: `Vaga ${palavra}`,
    tipo: "ESTAGIO",
    modalidade: "HIBRIDO",
  });

  for (const busca of [`${palavra} estágio`, `${palavra} estagio`, `${palavra} HÍBRIDO`]) {
    assert.deepEqual(
      (await buscar(busca)).oportunidades?.map((item) => item.id),
      [id],
      `deveria achar com: ${busca}`,
    );
  }
  assert.equal((await buscar(`${palavra} emprego`)).paginacao?.total, 0);
  assert.equal((await buscar(`${palavra} remoto`)).paginacao?.total, 0);
});

test("combina com tipo, modalidade e paginação", async () => {
  const palavra = marca();
  await publicar({ titulo: `A ${palavra}`, tipo: "ESTAGIO", modalidade: "REMOTO" });
  await publicar({ titulo: `B ${palavra}`, tipo: "ESTAGIO", modalidade: "PRESENCIAL" });
  await publicar({ titulo: `C ${palavra}`, tipo: "EMPREGO", modalidade: "REMOTO" });

  assert.equal((await buscar(palavra)).paginacao?.total, 3);
  assert.equal((await buscar(palavra, "&tipo=ESTAGIO")).paginacao?.total, 2);
  assert.equal((await buscar(palavra, "&tipo=ESTAGIO&modalidade=REMOTO")).paginacao?.total, 1);

  const pagina = await buscar(palavra, "&limite=2&pagina=2");
  assert.equal(pagina.oportunidades?.length, 1);
  assert.equal(pagina.paginacao?.total, 3);
  assert.equal(pagina.paginacao?.totalPaginas, 2);
});

test("catálogo busca só ativas, e o histórico fica em minhas publicações", async () => {
  const palavra = marca();
  const encerrada = await publicar({ titulo: `Encerrada ${palavra}` });
  const ativa = await publicar({ titulo: `Ativa ${palavra}` });
  assert.equal(
    (await requisicao(`/api/oportunidades/${encerrada}/encerrar`, tokenAutor, "PATCH")).status,
    200,
  );

  const catalogo = await buscar(palavra);
  assert.deepEqual(
    catalogo.oportunidades?.map((item) => item.id),
    [ativa],
  );

  const minhas = await requisicao(
    `/api/usuarios/me/oportunidades?busca=${palavra}&estado=ENCERRADA`,
    tokenAutor,
  );
  assert.equal(minhas.status, 200);
  assert.deepEqual(
    minhas.body.oportunidades?.map((item) => item.id),
    [encerrada],
  );
});

test("a busca em minhas publicações não mostra publicações de outro autor", async () => {
  const palavra = marca();
  await publicar({ titulo: `Do outro ${palavra}` }, tokenOutro);
  const minha = await publicar({ titulo: `Minha ${palavra}` });

  const minhas = await requisicao(`/api/usuarios/me/oportunidades?busca=${palavra}`, tokenAutor);
  assert.deepEqual(
    minhas.body.oportunidades?.map((item) => item.id),
    [minha],
  );
  assert.equal((await buscar(palavra)).paginacao?.total, 2);
});

test("busca vazia ou só com espaços lista normalmente", async () => {
  for (const busca of ["", "   "]) {
    const resposta = await requisicao(
      `/api/oportunidades?busca=${encodeURIComponent(busca)}`,
      tokenAutor,
    );
    assert.equal(resposta.status, 200);
  }
});

test("caracteres especiais são tratados como texto, não como curinga", async () => {
  const palavra = marca();
  await publicar({ titulo: `Vaga ${palavra}` });

  for (const curinga of ["%", "_", "%%", "\\"]) {
    const resultado = await buscar(curinga);
    assert.equal(resultado.paginacao?.total, 0, `"${curinga}" não deveria casar com tudo`);
  }
});

test("encontra textos que contêm % e _ de verdade", async () => {
  const palavra = marca();
  const id = await publicar({ titulo: `Desconto 100% ${palavra}`, empresa: `Time_${palavra}` });

  assert.deepEqual(
    (await buscar(`100% ${palavra}`)).oportunidades?.map((item) => item.id),
    [id],
  );
  assert.deepEqual(
    (await buscar(`time_${palavra}`)).oportunidades?.map((item) => item.id),
    [id],
  );
});

test("busca muito longa ou repetida retorna 400", async () => {
  const longa = await requisicao(`/api/oportunidades?busca=${"a".repeat(101)}`, tokenAutor);
  assert.equal(longa.status, 400);
  assert.equal(longa.body.erros?.[0]?.campo, "busca");

  const repetida = await requisicao("/api/oportunidades?busca=a&busca=b", tokenAutor);
  assert.equal(repetida.status, 400);
});
