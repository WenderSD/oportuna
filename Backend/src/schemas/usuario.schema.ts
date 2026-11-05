import { z } from "zod";

export const cadastroUsuarioSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((email) => email.toLowerCase()),

  senha: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .refine(
      (senha) => new TextEncoder().encode(senha).length <= 72,
      "A senha excede o limite permitido.",
    ),
});

export type CadastroUsuarioInput = z.infer<typeof cadastroUsuarioSchema>;
