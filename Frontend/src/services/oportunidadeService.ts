import { api } from "./api";
import type { Oportunidade, Paginacao } from "../types/oportunidade";

export interface ListaOportunidades {
  oportunidades: Oportunidade[];
  paginacao: Paginacao;
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

function criarMock(
  id: string,
  titulo: string,
  empresa: string,
  estado: Oportunidade["estado"],
  dados: Partial<Oportunidade> = {},
): Oportunidade {
  return {
    id,
    titulo,
    descricao: "Vaga de exemplo para testar a tela.",
    empresa,
    localizacao: null,
    modalidade: "HIBRIDO",
    tipo: "ESTAGIO",
    requisitos: [],
    linkCandidatura: null,
    emailContato: null,
    expiraEm: null,
    encerradaEm: null,
    criadoEm: "2026-11-01T10:00:00Z",
    atualizadoEm: "2026-11-01T10:00:00Z",
    autorId: "mock-usuario-1",
    estado,
    ...dados,
  };
}

let mockDb: Oportunidade[] = [
  criarMock(
    "1",
    "Estágio em Desenvolvimento de Software",
    "Empresa de tecnologia",
    "ATIVA",
  ),
  criarMock(
    "2",
    "Jovem Aprendiz Administrativo",
    "Organização parceira",
    "EXPIRADA",
    { tipo: "EMPREGO", modalidade: "PRESENCIAL", expiraEm: "2026-11-10T10:00:00Z" },
  ),
  criarMock(
    "3",
    "Suporte Técnico — Estágio",
    "Empresa de serviços",
    "ENCERRADA",
    { modalidade: "REMOTO", encerradaEm: "2026-11-12T10:00:00Z" },
  ),
];

export async function listarMinhasOportunidades(): Promise<ListaOportunidades> {
  if (USE_MOCK) {
    await espera(400);
    return {
      oportunidades: [...mockDb],
      paginacao: {
        pagina: 1,
        limite: mockDb.length,
        total: mockDb.length,
        totalPaginas: 1,
      },
    };
  }

  return api<ListaOportunidades>("/api/usuarios/me/oportunidades");
}

export async function encerrarOportunidade(id: string): Promise<Oportunidade> {
  if (USE_MOCK) {
    await espera(200);
    mockDb = mockDb.map((item) =>
      item.id === id
        ? {
            ...item,
            estado: "ENCERRADA",
            encerradaEm: new Date().toISOString(),
          }
        : item,
    );
    return mockDb.find((item) => item.id === id)!;
  }

  const dados = await api<{ oportunidade: Oportunidade }>(
    `/api/oportunidades/${id}/encerrar`,
    { method: "PATCH", body: JSON.stringify({}) },
  );
  return dados.oportunidade;
}