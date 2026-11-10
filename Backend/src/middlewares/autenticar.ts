import type { RequestHandler } from "express";
import { AppError } from "../lib/AppError.js";
import { verificarToken } from "../lib/jwt.js";

export const autenticar: RequestHandler = (req, _res, next) => {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
    throw new AppError("Token não informado.", 401);
  }

  const { usuarioId, papel } = verificarToken(cabecalho.slice(7));

  req.usuario = { id: usuarioId, papel };

  next();
};