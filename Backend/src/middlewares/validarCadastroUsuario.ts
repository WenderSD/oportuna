import type { RequestHandler } from "express";
import { cadastroUsuarioSchema } from "../schemas/usuario.schema.js";

export const validarCadastroUsuario: RequestHandler = (req, res, next) => {
  const resultado = cadastroUsuarioSchema.safeParse(req.body);

  if (!resultado.success) {
    res.status(400).json({
      mensagem: "Dados de cadastro inválidos.",
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
