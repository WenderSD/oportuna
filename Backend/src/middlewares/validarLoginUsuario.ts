import type { RequestHandler } from "express";
import { loginUsuarioSchema } from "../schemas/usuario.schema.js";

export const validarLoginUsuario: RequestHandler = (req, res, next) => {
  const resultado = loginUsuarioSchema.safeParse(req.body);

  if (!resultado.success) {
    res.status(400).json({
      mensagem: "Dados de login inválidos.",
      erros: resultado.error.issues.map((erro) => ({
        campo: erro.path.join("."),
        mensagem: erro.message,
      })),
    });

    return;
  }

  req.body = resultado.data;

  next();
};