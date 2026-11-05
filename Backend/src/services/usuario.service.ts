import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import type { CadastroUsuarioInput } from "../schemas/usuario.schema.js";

export class UsuarioService {
  async cadastrar(dados: CadastroUsuarioInput) {
    // 1. Verificar se o e-mail já está cadastrado
    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        email: dados.email,
      },
    });

    if (usuarioExistente) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    // 2. Gerar hash da senha
    const senhaHash = await bcrypt.hash(dados.senha, 12);

    // 3. Criar usuário no banco
    const usuario = await prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senhaHash,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        criadoEm: true,
      },
    });

    return usuario;
  }
}
