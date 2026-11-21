import { z } from "zod";
import { ModalidadeTrabalho, TipoOportunidade } from "../../generated/prisma/enums.js";
import { extrairRendaFormatada } from "../lib/renda.js";

const camposOportunidade = {
  titulo: z.string().trim().min(3).max(150),
  descricao: z.string().trim().min(10).max(10000),
  empresa: z.string().trim().min(2).max(150),
  tipo: z.enum(TipoOportunidade),
  modalidade: z.enum(ModalidadeTrabalho),
  localizacao: z.string().trim().min(2).max(150).nullable().optional(),
  renda: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine(
      (valor) => extrairRendaFormatada(valor) !== null,
      "Informe um valor de renda válido.",
    )
    .nullable()
    .optional(),
  requisitos: z.array(z.string().trim().min(1).max(500)).max(30),
  linkCandidatura: z
    .url({ protocol: /^https?$/ })
    .max(2048)
    .nullable()
    .optional(),
  emailContato: z.email().max(254).toLowerCase().nullable().optional(),
  expiraEm: z.iso
    .datetime({ offset: true })
    .transform((data) => new Date(data))
    .refine((data) => data.getTime() > Date.now(), "Informe uma data futura.")
    .nullable()
    .optional(),
};

export const criarOportunidadeSchema = z.strictObject({
  ...camposOportunidade,
  requisitos: camposOportunidade.requisitos.default([]),
});

export const editarOportunidadeSchema = z
  .strictObject(camposOportunidade)
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, "Informe ao menos um campo.");

const camposListagem = {
  tipo: z.enum(TipoOportunidade).optional(),
  modalidade: z.enum(ModalidadeTrabalho).optional(),
  pagina: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().max(10000))
    .default(1),
  limite: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().max(50))
    .default(10),
  busca: z.string().trim().max(100).optional(),
};

export const listarOportunidadesSchema = z.strictObject(camposListagem);
export const listarMinhasOportunidadesSchema = z.strictObject({
  ...camposListagem,
  estado: z.enum(["ATIVA", "EXPIRADA", "ENCERRADA"]).optional(),
});

export const oportunidadeIdSchema = z.uuid();
export const encerrarOportunidadeSchema = z.strictObject({}).optional();

export type CriarOportunidadeInput = z.infer<typeof criarOportunidadeSchema>;
export type EditarOportunidadeInput = z.infer<typeof editarOportunidadeSchema>;
export type ListarOportunidadesInput = z.infer<typeof listarMinhasOportunidadesSchema>;
