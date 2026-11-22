import type { RequestHandler } from "express";
import type {} from "../types/express.js";
import {
  criarOportunidadeSchema,
  editarOportunidadeSchema,
  encerrarOportunidadeSchema,
  listarMinhasOportunidadesSchema,
  listarOportunidadesSchema,
  oportunidadeIdSchema,
} from "../schemas/oportunidade.schema.js";
import { OportunidadeService } from "../services/oportunidade.service.js";

const oportunidadeService = new OportunidadeService();

export const criarOportunidade: RequestHandler = async (req, res) => {
  const dados = criarOportunidadeSchema.parse(req.body);
  const oportunidade = await oportunidadeService.criar(dados, req.usuario!.id);
  res.status(201).json({ mensagem: "Oportunidade publicada com sucesso.", oportunidade });
};

export const listarOportunidades: RequestHandler = async (req, res) => {
  const filtros = listarOportunidadesSchema.parse(req.query);
  res.json(await oportunidadeService.listar(filtros));
};

export const listarMinhasOportunidades: RequestHandler = async (req, res) => {
  const filtros = listarMinhasOportunidadesSchema.parse(req.query);
  res.json(await oportunidadeService.listar(filtros, req.usuario!.id));
};

export const buscarOportunidade: RequestHandler = async (req, res) => {
  const id = oportunidadeIdSchema.parse(req.params.id);
  res.json({ oportunidade: await oportunidadeService.buscar(id) });
};

export const editarOportunidade: RequestHandler = async (req, res) => {
  const id = oportunidadeIdSchema.parse(req.params.id);
  const dados = editarOportunidadeSchema.parse(req.body);
  const oportunidade = await oportunidadeService.editar(id, req.usuario!.id, dados);
  res.json({ mensagem: "Oportunidade atualizada com sucesso.", oportunidade });
};

export const encerrarOportunidade: RequestHandler = async (req, res) => {
  const id = oportunidadeIdSchema.parse(req.params.id);
  encerrarOportunidadeSchema.parse(req.body);
  const oportunidade = await oportunidadeService.encerrar(id, req.usuario!.id);
  res.json({ mensagem: "Oportunidade encerrada com sucesso.", oportunidade });
};
