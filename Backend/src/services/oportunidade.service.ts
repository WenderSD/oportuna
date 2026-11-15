import { type Oportunidade, Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";
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

export class OportunidadeService {
  async criar(dados: CriarOportunidadeInput, autorId: string) {
    const autor = await prisma.usuario.findUnique({ where: { id: autorId }, select: { id: true } });
    if (!autor) {
      throw new AppError("Usuário não encontrado. Faça login novamente.", 401);
    }

    const oportunidade = await prisma.oportunidade.create({ data: { ...dados, autorId } });
    return comEstado(oportunidade);
  }

  async listar(filtros: ListarOportunidadesInput, autorId?: string) {
    const agora = new Date();
    const where: Prisma.OportunidadeWhereInput = {
      tipo: filtros.tipo,
      modalidade: filtros.modalidade,
      ...(autorId ? { autorId } : {}),
      ...(!autorId || filtros.estado ? filtroEstado(filtros.estado ?? "ATIVA", agora) : {}),
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
    await this.buscarDoAutor(id, autorId);
    const resultado = await prisma.oportunidade.updateMany({
      where: { id, autorId, encerradaEm: null },
      data: dados,
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
