import { type Oportunidade, Prisma } from "../../generated/prisma/client.js";
import { ModalidadeTrabalho, TipoOportunidade } from "../../generated/prisma/enums.js";
import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";
import { extrairRendaFormatada, rendaParaTipo } from "../lib/renda.js";
import type {
  CriarOportunidadeInput,
  EditarOportunidadeInput,
  ListarOportunidadesInput,
} from "../schemas/oportunidade.schema.js";

function comEstado(oportunidade: Oportunidade, agora = new Date()) {
  const estado = oportunidade.encerradaEm
    ? "ENCERRADA"
    : oportunidade.expiraEm && oportunidade.expiraEm <= agora
      ? "EXPIRADA"
      : "ATIVA";

  return { ...oportunidade, estado };
}

function filtroEstado(estado: string, agora: Date): Prisma.OportunidadeWhereInput {
  if (estado === "ENCERRADA") {
    return { encerradaEm: { not: null } };
  }

  if (estado === "EXPIRADA") {
    return { encerradaEm: null, expiraEm: { lte: agora } };
  }

  return {
    encerradaEm: null,
    OR: [{ expiraEm: null }, { expiraEm: { gt: agora } }],
  };
}
// No LIKE do PostgreSQL, % e _ são curingas: aqui eles passam a valer como texto comum.
const escaparCuringas = (texto: string) => texto.replace(/[\\%_]/g, "\\$&");

const semAcento = (texto: string) => texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

// Cada palavra digitada precisa aparecer em pelo menos um campo da oportunidade.
function filtroPalavra(palavra: string): Prisma.OportunidadeWhereInput {
  const minuscula = palavra.toLowerCase();
  const capitalizada = minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
  const normal = semAcento(palavra);

  const trecho = escaparCuringas(palavra);

  const condicoes: Prisma.OportunidadeWhereInput[] = [
    { titulo: { contains: trecho, mode: "insensitive" } },
    { empresa: { contains: trecho, mode: "insensitive" } },
    { descricao: { contains: trecho, mode: "insensitive" } },
    { localizacao: { contains: trecho, mode: "insensitive" } },
    { requisitos: { hasSome: [palavra, minuscula, capitalizada] } },
  ];

  // Os rótulos da tela (Estágio, Remoto, Híbrido...) também funcionam como palavra de busca.
  const tipo = Object.values(TipoOportunidade).find((valor) => semAcento(valor) === normal);
  if (tipo) condicoes.push({ tipo });

  const modalidade = Object.values(ModalidadeTrabalho).find((valor) => semAcento(valor) === normal);
  if (modalidade) condicoes.push({ modalidade });

  return { OR: condicoes };
}

export class OportunidadeService {
  async criar(dados: CriarOportunidadeInput, autorId: string) {
    const autor = await prisma.usuario.findUnique({ where: { id: autorId }, select: { id: true } });
    if (!autor) {
      throw new AppError("Usuário não encontrado. Faça login novamente.", 401);
    }

    const renda = dados.renda == null ? dados.renda : rendaParaTipo(dados.renda, dados.tipo);
    const oportunidade = await prisma.oportunidade.create({
      data: { ...dados, renda, autorId },
    });
    return comEstado(oportunidade);
  }

  async listar(filtros: ListarOportunidadesInput, autorId?: string) {
    const agora = new Date();
    const palavras = (filtros.busca ?? "").split(/\s+/).filter(Boolean).slice(0, 5);
    const where: Prisma.OportunidadeWhereInput = {
      tipo: filtros.tipo,
      modalidade: filtros.modalidade,
      ...(autorId ? { autorId } : {}),
      ...(!autorId || filtros.estado ? filtroEstado(filtros.estado ?? "ATIVA", agora) : {}),
      ...(palavras.length > 0 ? { AND: palavras.map(filtroPalavra) } : {}),
    };

    const [oportunidades, total] = await prisma.$transaction(
      [
        prisma.oportunidade.findMany({
          where,
          orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
          skip: (filtros.pagina - 1) * filtros.limite,
          take: filtros.limite,
        }),
        prisma.oportunidade.count({ where }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    return {
      oportunidades: oportunidades.map((oportunidade) => comEstado(oportunidade, agora)),
      paginacao: {
        pagina: filtros.pagina,
        limite: filtros.limite,
        total,
        totalPaginas: Math.ceil(total / filtros.limite),
      },
    };
  }

  async buscar(id: string) {
    const oportunidade = await prisma.oportunidade.findUnique({ where: { id } });
    if (!oportunidade) {
      throw new AppError("Oportunidade não encontrada.", 404);
    }

    return comEstado(oportunidade);
  }

  private async buscarDoAutor(id: string, autorId: string) {
    const oportunidade = await this.buscar(id);
    if (oportunidade.autorId !== autorId) {
      throw new AppError("Você não pode gerenciar esta oportunidade.", 403);
    }

    return oportunidade;
  }

  async editar(id: string, autorId: string, dados: EditarOportunidadeInput) {
    const oportunidadeAtual = await this.buscarDoAutor(id, autorId);
    const dadosAtualizados: EditarOportunidadeInput = { ...dados };

    if (dados.renda !== undefined) {
      dadosAtualizados.renda =
        dados.renda === null
          ? null
          : rendaParaTipo(dados.renda, dados.tipo ?? oportunidadeAtual.tipo);
    } else if (dados.tipo !== undefined && oportunidadeAtual.renda) {
      const rendaFormatada = extrairRendaFormatada(oportunidadeAtual.renda);
      if (rendaFormatada) {
        dadosAtualizados.renda = rendaParaTipo(rendaFormatada, dados.tipo);
      }
    }

    const resultado = await prisma.oportunidade.updateMany({
      where: { id, autorId, encerradaEm: null },
      data: dadosAtualizados,
    });

    if (resultado.count === 0) {
      throw new AppError("Uma oportunidade encerrada não pode ser editada.", 409);
    }

    return this.buscar(id);
  }

  async encerrar(id: string, autorId: string) {
    await this.buscarDoAutor(id, autorId);
    await prisma.oportunidade.updateMany({
      where: { id, autorId, encerradaEm: null },
      data: { encerradaEm: new Date() },
    });

    return this.buscar(id);
  }
}
