import { Router } from "express";
import { listarMinhasOportunidades } from "../controllers/oportunidade.controller.js";
import { buscarPerfil, cadastrarUsuario, loginUsuario } from "../controllers/usuario.controller.js";
import { autenticar } from "../middlewares/autenticar.js";
import { validarCadastroUsuario } from "../middlewares/validarCadastroUsuario.js";
import { validarLoginUsuario } from "../middlewares/validarLoginUsuario.js";

const usuarioRouter = Router();

usuarioRouter.post("/login", validarLoginUsuario, loginUsuario);
usuarioRouter.post("/", validarCadastroUsuario, cadastrarUsuario);
usuarioRouter.get("/me", autenticar, buscarPerfil);
usuarioRouter.get("/me/oportunidades", autenticar, listarMinhasOportunidades);

export default usuarioRouter;
