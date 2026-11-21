import { api } from "./api";
import type {
  DadosOportunidade,
  FiltrosOportunidades,
  Oportunidade,
  Paginacao,
} from "../types/oportunidade";

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
    renda: null,
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

function paginar(lista: Oportunidade[]): ListaOportunidades {
  return {
    oportunidades: [...lista],
    paginacao: {
      pagina: 1,
      limite: lista.length || 1,
      total: lista.length,
      totalPaginas: 1,
    },
  };
}

// O backend recusa campos vazios, então removemos "" e listas vazias.
function limpar(dados: Partial<DadosOportunidade>) {
  const limpo: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(dados)) {
    if (valor === undefined || valor === "") continue;
    if (Array.isArray(valor) && valor.length === 0) continue;
    limpo[chave] = valor;
  }
  return limpo;
}

function montarQuery(filtros: FiltrosOportunidades) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== "") params.set(chave, String(valor));
  }
  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

// Home: vagas de todos os usuários.
export async function listarOportunidades(
  filtros: FiltrosOportunidades = {},
): Promise<ListaOportunidades> {
  if (USE_MOCK) {
    await espera(400);
    return paginar(
      mockDb.filter(
        (o) =>
          (!filtros.tipo || o.tipo === filtros.tipo) &&
          (!filtros.modalidade || o.modalidade === filtros.modalidade) &&
          o.estado === (filtros.estado ?? "ATIVA"),
      ),
    );
  }

  return api<ListaOportunidades>(`/api/oportunidades${montarQuery(filtros)}`);
}

// Perfil: vagas do usuário logado.
export async function listarMinhasOportunidades(): Promise<ListaOportunidades> {
  if (USE_MOCK) {
    await espera(400);
    return paginar(mockDb);
  }

  return api<ListaOportunidades>("/api/usuarios/me/oportunidades");
}

export async function buscarOportunidade(id: string): Promise<Oportunidade> {
  if (USE_MOCK) {
    await espera(300);
    const achada = mockDb.find((o) => o.id === id);
    if (!achada) throw new Error("Oportunidade não encontrada.");
    return achada;
  }

  const dados = await api<{ oportunidade: Oportunidade }>(
    `/api/oportunidades/${id}`,
  );
  return dados.oportunidade;
}

export async function criarOportunidade(
  dados: DadosOportunidade,
): Promise<Oportunidade> {
  if (USE_MOCK) {
    await espera(500);
    const nova = criarMock(
      String(Date.now()),
      dados.titulo,
      dados.empresa,
      "ATIVA",
      {
        descricao: dados.descricao,
        modalidade: dados.modalidade,
        tipo: dados.tipo,
        localizacao: dados.localizacao ?? null,
        requisitos: dados.requisitos ?? [],
        linkCandidatura: dados.linkCandidatura ?? null,
        emailContato: dados.emailContato ?? null,
        expiraEm: dados.expiraEm ?? null,
        criadoEm: new Date().toISOString(),
      },
    );
    mockDb = [nova, ...mockDb];
    return nova;
  }

  const resposta = await api<{ oportunidade: Oportunidade }>(
    "/api/oportunidades",
    { method: "POST", body: JSON.stringify(limpar(dados)) },
  );
  return resposta.oportunidade;
}

export async function editarOportunidade(
  id: string,
  dados: Partial<DadosOportunidade>,
): Promise<Oportunidade> {
  if (USE_MOCK) {
    await espera(400);
    mockDb = mockDb.map((o) =>
      o.id === id ? ({ ...o, ...dados } as Oportunidade) : o,
    );
    return mockDb.find((o) => o.id === id)!;
  }

  const resposta = await api<{ oportunidade: Oportunidade }>(
    `/api/oportunidades/${id}`,
    { method: "PATCH", body: JSON.stringify(limpar(dados)) },
  );
  return resposta.oportunidade;
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
