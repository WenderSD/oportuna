export type Modalidade = "PRESENCIAL" | "HIBRIDO" | "REMOTO";
export type StatusOportunidade = "ativa" | "analise" | "encerrada";

export interface Oportunidade {
  id: string;
  titulo: string;
  descricao: string;
  empresa: string;
  localizacao?: string | null;
  modalidade: Modalidade;
  linkCandidatura?: string | null;
  criadoEm: string;

  // Ainda não existem no banco. O front trata como opcionais.
  status?: StatusOportunidade;
  tipo?: string;
}

export const modalidadeLabel: Record<Modalidade, string> = {
  PRESENCIAL: "Presencial",
  HIBRIDO: "Híbrido",
  REMOTO: "Remoto",
};