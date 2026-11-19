import { api } from "./api";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: "USUARIO" | "ADMINISTRADOR";
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

const usuarioMock: Usuario = {
  id: "mock-usuario-1",
  nome: "Nome do estudante",
  email: "estudante@exemplo.com",
  papel: "USUARIO",
};

export function sair() {
  localStorage.removeItem("token");
}

export async function cadastrar(dados: DadosCadastro): Promise<void> {
  if (USE_MOCK) {
    await espera(400);
    return;
  }

  await api("/api/usuarios", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export async function login(email: string, senha: string): Promise<void> {
  if (USE_MOCK) {
    await espera(300);
    localStorage.setItem("token", "token-de-teste");
    return;
  }

  const dados = await api<{ token?: string; accessToken?: string }>(
    "/api/usuarios/login",
    { method: "POST", body: JSON.stringify({ email, senha }) },
  );

  const token = dados.token ?? dados.accessToken;
  if (!token) throw new Error("O servidor não devolveu o token de acesso.");

  localStorage.setItem("token", token);
}

export async function buscarPerfil(): Promise<Usuario> {
  if (USE_MOCK) {
    await espera(300);
    return usuarioMock;
  }

  const dados = await api<{ usuario: Usuario }>("/api/usuarios/me");
  return dados.usuario;
}