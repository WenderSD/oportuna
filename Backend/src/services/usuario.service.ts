import { AppError } from "../lib/AppError.js";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { gerarToken } from "../lib/jwt.js";
import type {
  CadastroUsuarioInput,
  LoginUsuarioInput,
} from "../schemas/usuario.schema.js";

export class UsuarioService {
  async cadastrar(dados: CadastroUsuarioInput) {
    // 1. Verificar se o e-mail já está cadastrado
    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        email: dados.email,
      },
    });

    if (usuarioExistente) {
      throw new AppError("Este e-mail já está cadastrado.", 409);
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

  async login(dados: LoginUsuarioInput) {
    const usuario = await prisma.usuario.findUnique({
      where: { email: dados.email },
    });

    const senhaConfere = usuario
      ? await bcrypt.compare(dados.senha, usuario.senhaHash)
      : false;

    // Mesma mensagem para e-mail inexistente e senha errada (não revela qual falhou)
    if (!usuario || !senhaConfere) {
      throw new AppError("E-mail ou senha incorretos.", 401);
    }

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        criadoEm: usuario.criadoEm,
      },
      token: gerarToken(usuario.id, usuario.papel),
    };
  }

  async buscarPerfil(usuarioId: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        criadoEm: true,
      },
    });

    if (!usuario) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    return usuario;
  }
}