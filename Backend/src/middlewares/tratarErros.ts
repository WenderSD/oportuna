import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/AppError.js";

export const tratarErros: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      mensagem: "Dados da requisição inválidos.",
      erros: error.issues.map((erro) => ({
        campo: erro.path.join("."),
        mensagem: erro.message,
      })),
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ mensagem: error.message });
    return;
  }

  // JSON quebrado no body da requisição
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ mensagem: "JSON inválido." });
    return;
  }

  if (error?.type === "entity.too.large") {
    res.status(413).json({ mensagem: "O corpo da requisição excede o limite de 100 KB." });
    return;
  }

  console.error(error);
  res.status(500).json({ mensagem: "Erro interno do servidor." });
};
