import bcrypt from "bcryptjs";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  if (
    process.env.ALLOW_DEMO_SEED !== "true" ||
    process.env.NODE_ENV === "production" ||
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    decodeURIComponent(url.pathname).endsWith("_test") ||
    [...url.searchParams.keys()].some((chave) => chave !== "schema") ||
    url.searchParams.getAll("schema").length > 1 ||
    (url.searchParams.has("schema") && url.searchParams.get("schema") !== "public") ||
    url.hash !== ""
  ) {
    throw new Error(
      "Para criar dados fictícios, use um banco local e defina ALLOW_DEMO_SEED=true.",
    );
  }

  const senhaHash = await bcrypt.hash("Demo-oportuna-123", 12);
  const autor = await prisma.usuario.upsert({
    where: { email: "demo@example.test" },
    update: {},
    create: { nome: "Pessoa de demonstração", email: "demo@example.test", senhaHash },
  });
  const exemplos: Prisma.OportunidadeCreateManyInput[] = [
    {
      id: "00000000-0000-4000-8000-000000000101",
      autorId: autor.id,
      titulo: "Estágio em desenvolvimento",
      empresa: "Empresa Exemplo",
      descricao: "Desenvolvimento de aplicações para a comunidade acadêmica.",
      tipo: "ESTAGIO",
      modalidade: "REMOTO",
      requisitos: ["Cursando graduação"],
      linkCandidatura: "https://example.com/estagio",
      renda: "Bolsa-auxílio de R$ 1.200,00",
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      autorId: autor.id,
      titulo: "Analista de dados",
      empresa: "Empresa Exemplo",
      descricao: "Análise de dados e elaboração de relatórios em equipe.",
      tipo: "EMPREGO",
      modalidade: "HIBRIDO",
      emailContato: "vagas@example.test",
      localizacao: "Belo Horizonte, MG",
    },
    {
      id: "00000000-0000-4000-8000-000000000103",
      autorId: autor.id,
      titulo: "Projeto de pesquisa",
      empresa: "Universidade Exemplo",
      descricao: "Pesquisa acadêmica voltada a projetos de impacto social.",
      tipo: "PESQUISA",
      modalidade: "PRESENCIAL",
      localizacao: "Campus de demonstração",
    },
    {
      id: "00000000-0000-4000-8000-000000000104",
      autorId: autor.id,
      titulo: "Oficina de preparação profissional",
      empresa: "Comunidade Exemplo",
      descricao: "Oficina para preparação de currículos e entrevistas.",
      tipo: "OUTRO",
      modalidade: "REMOTO",
    },
    {
      id: "00000000-0000-4000-8000-000000000105",
      autorId: autor.id,
      titulo: "Estágio com prazo expirado",
      empresa: "Empresa Exemplo",
      descricao: "Publicação fictícia para demonstrar o histórico de oportunidades expiradas.",
      tipo: "ESTAGIO",
      modalidade: "REMOTO",
      expiraEm: new Date("2020-01-01T00:00:00Z"),
    },
    {
      id: "00000000-0000-4000-8000-000000000106",
      autorId: autor.id,
      titulo: "Publicação encerrada",
      empresa: "Empresa Exemplo",
      descricao: "Publicação fictícia para demonstrar o encerramento pelo autor.",
      tipo: "EMPREGO",
      modalidade: "PRESENCIAL",
      encerradaEm: new Date("2020-01-01T00:00:00Z"),
    },
  ];

  for (const exemplo of exemplos) {
    const existente = await prisma.oportunidade.findUnique({ where: { id: exemplo.id } });
    if (existente && existente.autorId !== autor.id) {
      throw new Error("Um identificador de demonstração já pertence a outro autor.");
    }
    await prisma.oportunidade.upsert({ where: { id: exemplo.id }, update: {}, create: exemplo });
  }

  console.log("Dados fictícios disponíveis. Conta: demo@example.test. Senha: Demo-oportuna-123.");
}

main()
  .catch((error: Error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
