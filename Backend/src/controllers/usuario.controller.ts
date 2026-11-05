import type { RequestHandler } from "express";
import { UsuarioService } from "../services/usuario.service.js";

const usuarioService = new UsuarioService();

export const cadastrarUsuario: RequestHandler = async (req, res, next) => {
  try {
    const usuario = await usuarioService.cadastrar(req.body);

    res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso.",
      usuario,
    });
  } catch (error) {
    next(error);
  }
};
