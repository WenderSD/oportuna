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

export const loginUsuario: RequestHandler = async (req, res, next) => {
  try {
    const resultado = await usuarioService.login(req.body);

    res.status(200).json({
      mensagem: "Login realizado com sucesso.",
      ...resultado,
    });
  } catch (error) {
    next(error);
  }
};

export const buscarPerfil: RequestHandler = async (req, res, next) => {
  try {
    const usuario = await usuarioService.buscarPerfil(req.usuario!.id);

    res.status(200).json({ usuario });
  } catch (error) {
    next(error);
  }
};
