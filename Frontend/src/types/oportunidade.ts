export type Modalidade = "PRESENCIAL" | "HIBRIDO" | "REMOTO";
export type TipoOportunidade = "EMPREGO" | "ESTAGIO" | "PESQUISA" | "OUTRO";
export type EstadoOportunidade = "ATIVA" | "EXPIRADA" | "ENCERRADA";

export interface Oportunidade {
  id: string;
  titulo: string;
  descricao: string;
  empresa: string;
  localizacao: string | null;
  modalidade: Modalidade;
  tipo: TipoOportunidade;
  requisitos: string[];
  linkCandidatura: string | null;
  emailContato: string | null;
  expiraEm: string | null;
  encerradaEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
  autorId: string;
  estado: EstadoOportunidade;
}

export interface Paginacao {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export interface DadosOportunidade {
  titulo: string;
  descricao: string;
  empresa: string;
  localizacao?: string;
  modalidade: Modalidade;
  tipo: TipoOportunidade;
  requisitos?: string[];
  linkCandidatura?: string;
  emailContato?: string;
  expiraEm?: string;
}

export interface FiltrosOportunidades {
  tipo?: TipoOportunidade;
  modalidade?: Modalidade;
  estado?: EstadoOportunidade;
  pagina?: number;
  limite?: number;
}

export const modalidadeLabel: Record<Modalidade, string> = {
  PRESENCIAL: "Presencial",
  HIBRIDO: "Híbrido",
  REMOTO: "Remoto",
};

export const tipoLabel: Record<TipoOportunidade, string> = {
  EMPREGO: "Emprego",
  ESTAGIO: "Estágio",
  PESQUISA: "Pesquisa",
  OUTRO: "Outro",
};

export const estadoLabel: Record<EstadoOportunidade, string> = {
  ATIVA: "Ativa",
  EXPIRADA: "Expirada",
  ENCERRADA: "Encerrada",
};