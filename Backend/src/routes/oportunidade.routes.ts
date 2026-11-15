import { Router } from "express";
import {
  buscarOportunidade,
  criarOportunidade,
  editarOportunidade,
  encerrarOportunidade,
  listarOportunidades,
} from "../controllers/oportunidade.controller.js";
import { autenticar } from "../middlewares/autenticar.js";

const oportunidadeRouter = Router();

oportunidadeRouter.use(autenticar);
oportunidadeRouter.get("/", listarOportunidades);
oportunidadeRouter.post("/", criarOportunidade);
oportunidadeRouter.get("/:id", buscarOportunidade);
oportunidadeRouter.patch("/:id", editarOportunidade);
oportunidadeRouter.patch("/:id/encerrar", encerrarOportunidade);

export default oportunidadeRouter;
