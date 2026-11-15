import "dotenv/config";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { AppError } from "./AppError.js";

const tokenSchema = z.object({
  sub: z.uuid(),
  papel: z.enum(["USUARIO", "ADMINISTRADOR"]),
});

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
  const segredo = obterSegredo();
  try {
    const dados = tokenSchema.parse(jwt.verify(token, segredo, { algorithms: ["HS256"] }));

    return { usuarioId: dados.sub, papel: dados.papel };
  } catch {
    throw new AppError("Token inválido ou expirado.", 401);
  }
}
