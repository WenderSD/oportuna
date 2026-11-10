import { Router } from "express";
import {
  cadastrarUsuario,
  loginUsuario,
} from "../controllers/usuario.controller.js";
import { validarCadastroUsuario } from "../middlewares/validarCadastroUsuario.js";
import { validarLoginUsuario } from "../middlewares/validarLoginUsuario.js";
import { autenticar } from "../middlewares/autenticar.js";
import { buscarPerfil } from "../controllers/usuario.controller.js";

const usuarioRouter = Router();

usuarioRouter.post("/login", validarLoginUsuario, loginUsuario);
usuarioRouter.post("/", validarCadastroUsuario, cadastrarUsuario);
usuarioRouter.get("/me", autenticar, buscarPerfil);

export default usuarioRouter;
