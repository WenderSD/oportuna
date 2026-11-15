import "dotenv/config";
import { spawnSync } from "node:child_process";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error("Defina TEST_DATABASE_URL para um PostgreSQL local exclusivo de testes.");
}

const url = new URL(connectionString);
if (
  !["postgresql:", "postgres:"].includes(url.protocol) ||
  !["localhost", "127.0.0.1", "[::1]", "postgres"].includes(url.hostname) ||
  !/^\/[a-zA-Z0-9_]+_test$/.test(url.pathname) ||
  [...url.searchParams.keys()].some((chave) => chave !== "schema") ||
  url.searchParams.getAll("schema").length > 1 ||
  (url.searchParams.has("schema") && url.searchParams.get("schema") !== "public") ||
  url.hash !== ""
) {
  throw new Error(
    "O banco de testes deve ser local, ter nome terminado em _test e usar o schema public.",
  );
}

const env = {
  ...process.env,
  DATABASE_URL: connectionString,
  JWT_SECRET: "chave-ficticia-exclusiva-dos-testes-oportuna",
  JWT_EXPIRES_IN: "1h",
  NODE_ENV: "test",
};

function executar(args) {
  const resultado = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (resultado.error) throw resultado.error;
  if (resultado.status !== 0) process.exit(resultado.status ?? 1);
}

executar([
  "node_modules/prisma/build/index.js",
  "migrate",
  "deploy",
  "--config",
  "prisma7.config.ts",
]);
executar([
  "--import",
  "tsx",
  "--test",
  "--test-concurrency=1",
  "tests/ambiente.test.ts",
  "tests/autenticacao.test.ts",
  "tests/oportunidades.test.ts",
]);
