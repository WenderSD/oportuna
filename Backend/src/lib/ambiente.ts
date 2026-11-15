import "dotenv/config";
import jwt, { type SignOptions } from "jsonwebtoken";

export function validarAmbiente(ambiente: NodeJS.ProcessEnv = process.env) {
  try {
    const url = new URL(ambiente.DATABASE_URL ?? "");
    if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error("Defina DATABASE_URL com uma URL PostgreSQL válida.");
  }

  if (!ambiente.JWT_SECRET?.trim()) {
    throw new Error("Defina JWT_SECRET antes de iniciar a API.");
  }

  try {
    const token = jwt.sign({}, ambiente.JWT_SECRET, {
      expiresIn: (ambiente.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"],
    });
    const payload = jwt.decode(token) as jwt.JwtPayload;
    if (!payload.exp || !payload.iat || payload.exp <= payload.iat) throw new Error();
  } catch {
    throw new Error("Defina JWT_EXPIRES_IN com uma duração positiva, como 1h ou 1d.");
  }

  const porta = Number(ambiente.PORT ?? 3000);
  if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
    throw new Error("Defina PORT com um inteiro entre 1 e 65535.");
  }
  return { porta };
}
