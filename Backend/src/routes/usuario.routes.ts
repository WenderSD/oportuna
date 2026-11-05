import { Router } from "express";
import { cadastrarUsuario } from "../controllers/usuario.controller.js";
import { validarCadastroUsuario } from "../middlewares/validarCadastroUsuario.js";

const usuarioRouter = Router();

usuarioRouter.post("/", validarCadastroUsuario, cadastrarUsuario);

export default usuarioRouter;
