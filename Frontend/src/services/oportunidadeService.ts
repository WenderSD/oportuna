import { api } from "./api";
import type { Oportunidade } from "../types/oportunidade";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

let mockDb: Oportunidade[] = [
  {
    id: "1",
    titulo: "Estágio em Desenvolvimento de Software",
    descricao: "Oportunidade para estudantes de tecnologia.",
    empresa: "Empresa de tecnologia",
    modalidade: "HIBRIDO",
    criadoEm: "2026-11-01T10:00:00Z",
    status: "ativa",
  },
  {
    id: "2",
    titulo: "Jovem Aprendiz Administrativo",
    descricao: "Vaga para jovem aprendiz na área administrativa.",
    empresa: "Organização parceira",
    modalidade: "PRESENCIAL",
    criadoEm: "2026-11-05T10:00:00Z",
    status: "analise",
  },
  {
    id: "3",
    titulo: "Suporte Técnico — Estágio",
    descricao: "Atendimento e suporte a usuários.",
    empresa: "Empresa de serviços",
    modalidade: "REMOTO",
    criadoEm: "2026-10-20T10:00:00Z",
    status: "encerrada",
  },
];

// ATENÇÃO: os caminhos abaixo são provisórios. Quando o backend definir as
// rotas reais, é só ajustar aqui.
export async function listarMinhasOportunidades(): Promise<Oportunidade[]> {
  if (USE_MOCK) {
    await espera(400);
    return [...mockDb];
  }
  return api<Oportunidade[]>("/api/usuarios/me/oportunidades");
}

export async function excluirOportunidade(id: string): Promise<void> {
  if (USE_MOCK) {
    await espera(200);
    mockDb = mockDb.filter((item) => item.id !== id);
    return;
  }
  await api<void>(`/api/oportunidades/${id}`, { method: "DELETE" });
}