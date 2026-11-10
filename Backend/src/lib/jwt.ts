import "dotenv/config";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AppError } from "./AppError.js";

export type DadosDoToken = {
  usuarioId: string;
  papel: string;
};

function obterSegredo(): string {
  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    throw new Error("A variável JWT_SECRET não foi definida.");
  }

  return segredo;
}

export function gerarToken(usuarioId: string, papel: string): string {
  const opcoes: SignOptions = {
    subject: usuarioId,
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"],
  };

  return jwt.sign({ papel }, obterSegredo(), opcoes);
}

export function verificarToken(token: string): DadosDoToken {
  try {
    const dados = jwt.verify(token, obterSegredo()) as jwt.JwtPayload;

    return { usuarioId: dados.sub as string, papel: dados.papel as string };
  } catch {
    throw new AppError("Token inválido ou expirado.", 401);
  }
}