import type { ErrorRequestHandler } from "express";
import { AppError } from "../lib/AppError.js";

export const tratarErros: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ mensagem: error.message });
    return;
  }

  // JSON quebrado no body da requisição
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ mensagem: "JSON inválido." });
    return;
  }

  console.error(error);
  res.status(500).json({ mensagem: "Erro interno do servidor." });
};