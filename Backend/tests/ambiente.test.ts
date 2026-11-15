import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { validarAmbiente } from "../src/lib/ambiente.js";

const ambiente = {
  DATABASE_URL: "postgresql://teste:senha-ficticia@127.0.0.1/oportuna_test",
  JWT_SECRET: "chave-ficticia-de-teste",
};

test("configuração válida admite duração padrão e porta padrão", () => {
  assert.deepEqual(validarAmbiente(ambiente), { porta: 3000 });
  assert.deepEqual(validarAmbiente({ ...ambiente, PORT: "4000", JWT_EXPIRES_IN: "2h" }), {
    porta: 4000,
  });
});

for (const [campo, valor] of [
  ["DATABASE_URL", ""],
  ["DATABASE_URL", "http://localhost/banco"],
  ["JWT_SECRET", ""],
  ["JWT_SECRET", "   "],
  ["JWT_EXPIRES_IN", "invalido"],
  ["JWT_EXPIRES_IN", "0s"],
  ["JWT_EXPIRES_IN", "-1h"],
  ["PORT", "0"],
  ["PORT", "65536"],
  ["PORT", "3000.5"],
  ["PORT", "invalida"],
] as const) {
  test(`configuração rejeita ${campo}=${JSON.stringify(valor)}`, () => {
    assert.throws(
      () => validarAmbiente({ ...ambiente, [campo]: valor }),
      (erro: unknown) => {
        assert.ok(erro instanceof Error);
        assert.ok(erro.message.includes(campo));
        assert.ok(!erro.message.includes("senha-ficticia"));
        return true;
      },
    );
  });
}

test("inicialização recusa chave JWT vazia antes de abrir a API", () => {
  const resultado = spawnSync(process.execPath, ["--import", "tsx", "src/server.ts"], {
    env: { ...process.env, ...ambiente, JWT_SECRET: "" },
    encoding: "utf8",
    timeout: 10000,
  });
  assert.equal(resultado.status, 1);
  assert.match(resultado.stderr, /Defina JWT_SECRET/);
  assert.ok(!resultado.stdout.includes("API executando"));
  assert.ok(!resultado.stderr.includes("senha-ficticia"));
});
