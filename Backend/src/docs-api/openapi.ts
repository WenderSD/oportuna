export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "OportUna API",
    description: "Documentação oficial da API da plataforma OportUna.",
    version: "1.0.0",
  },
  servers: [
    {
      url: "/",
      description: "Servidor atual",
    },
  ],
  tags: [
    { name: "Usuários", description: "Cadastro, login e perfil." },
    { name: "Oportunidades", description: "Gerenciamento de oportunidades." },
    { name: "Saúde", description: "Verificação da API e do banco." },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Informe o token JWT recebido no login.",
      },
    },
    schemas: {
      Usuario: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nome: { type: "string" },
          email: { type: "string", format: "email" },
          papel: { type: "string", enum: ["USUARIO", "ADMINISTRADOR"] },
          criadoEm: { type: "string", format: "date-time" },
        },
      },
      Oportunidade: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          titulo: { type: "string" },
          descricao: { type: "string" },
          empresa: { type: "string" },
          localizacao: { type: "string", nullable: true },
          modalidade: {
            type: "string",
            enum: ["PRESENCIAL", "HIBRIDO", "REMOTO"],
          },
          tipo: {
            type: "string",
            enum: ["EMPREGO", "ESTAGIO", "PESQUISA", "OUTRO"],
          },
          requisitos: { type: "array", items: { type: "string" } },
          linkCandidatura: { type: "string", nullable: true },
          emailContato: { type: "string", nullable: true },
          expiraEm: { type: "string", format: "date-time", nullable: true },
          encerradaEm: { type: "string", format: "date-time", nullable: true },
          criadoEm: { type: "string", format: "date-time" },
          atualizadoEm: { type: "string", format: "date-time" },
          autorId: { type: "string", format: "uuid" },
          estado: {
            type: "string",
            enum: ["ATIVA", "EXPIRADA", "ENCERRADA"],
          },
        },
      },
      Erro: {
        type: "object",
        properties: {
          mensagem: { type: "string" },
        },
      },
      ErroValidacao: {
        type: "object",
        properties: {
          mensagem: { type: "string" },
          erros: {
            type: "array",
            items: {
              type: "object",
              properties: {
                campo: { type: "string" },
                mensagem: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/usuarios": {
      post: {
        tags: ["Usuários"],
        summary: "Cadastrar usuário",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome", "email", "senha"],
                properties: {
                  nome: { type: "string", minLength: 2, maxLength: 100 },
                  email: { type: "string", format: "email" },
                  senha: { type: "string", minLength: 8 },
                },
              },
              example: {
                nome: "Maria Silva",
                email: "maria@email.com",
                senha: "senha123",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuário cadastrado com sucesso.",
            content: {
              "application/json": {
                example: {
                  mensagem: "Usuário cadastrado com sucesso.",
                  usuario: {
                    id: "uuid",
                    nome: "Maria Silva",
                    email: "maria@email.com",
                    papel: "USUARIO",
                    criadoEm: "2026-11-20T12:00:00.000Z",
                  },
                },
              },
            },
          },
          "400": { description: "Dados de cadastro inválidos." },
          "409": { description: "E-mail já cadastrado." },
        },
      },
    },
    "/api/usuarios/login": {
      post: {
        tags: ["Usuários"],
        summary: "Realizar login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "senha"],
                properties: {
                  email: { type: "string", format: "email" },
                  senha: { type: "string" },
                },
              },
              example: {
                email: "maria@email.com",
                senha: "senha123",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login realizado com sucesso.",
            content: {
              "application/json": {
                example: {
                  mensagem: "Login realizado com sucesso.",
                  usuario: {
                    id: "uuid",
                    nome: "Maria Silva",
                    email: "maria@email.com",
                    papel: "USUARIO",
                    criadoEm: "2026-11-20T12:00:00.000Z",
                  },
                  token: "seu-token-jwt",
                },
              },
            },
          },
          "400": { description: "Dados de login inválidos." },
          "401": { description: "E-mail ou senha incorretos." },
        },
      },
    },
    "/api/usuarios/me": {
      get: {
        tags: ["Usuários"],
        summary: "Consultar perfil autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Perfil encontrado.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    usuario: { $ref: "#/components/schemas/Usuario" },
                  },
                },
              },
            },
          },
          "401": { description: "Token não informado ou inválido." },
          "404": { description: "Usuário não encontrado." },
        },
      },
    },
    "/api/usuarios/me/oportunidades": {
      get: {
        tags: ["Oportunidades"],
        summary: "Listar minhas oportunidades",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "tipo",
            in: "query",
            schema: { type: "string", enum: ["EMPREGO", "ESTAGIO", "PESQUISA", "OUTRO"] },
          },
          {
            name: "modalidade",
            in: "query",
            schema: { type: "string", enum: ["PRESENCIAL", "HIBRIDO", "REMOTO"] },
          },
          {
            name: "estado",
            in: "query",
            schema: { type: "string", enum: ["ATIVA", "EXPIRADA", "ENCERRADA"] },
          },
          { name: "pagina", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limite", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
        ],
        responses: {
          "200": { description: "Lista de oportunidades do usuário." },
          "400": { description: "Filtros inválidos." },
          "401": { description: "Não autenticado." },
        },
      },
    },
    "/api/oportunidades": {
      get: {
        tags: ["Oportunidades"],
        summary: "Listar oportunidades",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "tipo",
            in: "query",
            schema: { type: "string", enum: ["EMPREGO", "ESTAGIO", "PESQUISA", "OUTRO"] },
          },
          {
            name: "modalidade",
            in: "query",
            schema: { type: "string", enum: ["PRESENCIAL", "HIBRIDO", "REMOTO"] },
          },
          { name: "pagina", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limite", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
        ],
        responses: {
          "200": { description: "Lista paginada de oportunidades." },
          "401": { description: "Não autenticado." },
        },
      },
      post: {
        tags: ["Oportunidades"],
        summary: "Criar oportunidade",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["titulo", "descricao", "empresa", "tipo", "modalidade"],
                properties: {
                  titulo: { type: "string", minLength: 3, maxLength: 150 },
                  descricao: { type: "string", minLength: 10, maxLength: 10000 },
                  empresa: { type: "string", minLength: 2, maxLength: 150 },
                  tipo: { type: "string", enum: ["EMPREGO", "ESTAGIO", "PESQUISA", "OUTRO"] },
                  modalidade: { type: "string", enum: ["PRESENCIAL", "HIBRIDO", "REMOTO"] },
                  localizacao: { type: "string", nullable: true },
                  requisitos: { type: "array", items: { type: "string" } },
                  linkCandidatura: { type: "string", format: "uri", nullable: true },
                  emailContato: { type: "string", format: "email", nullable: true },
                  expiraEm: { type: "string", format: "date-time", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Oportunidade publicada com sucesso." },
          "400": { description: "Dados inválidos." },
          "401": { description: "Não autenticado." },
        },
      },
    },
    "/api/oportunidades/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        tags: ["Oportunidades"],
        summary: "Buscar oportunidade por ID",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Oportunidade encontrada." },
          "400": { description: "ID inválido." },
          "401": { description: "Não autenticado." },
          "404": { description: "Oportunidade não encontrada." },
        },
      },
      patch: {
        tags: ["Oportunidades"],
        summary: "Editar oportunidade",
        security: [{ bearerAuth: [] }],
        description:
          "Somente o autor pode editar a oportunidade. Todos os campos são opcionais, mas ao menos um deve ser enviado.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                minProperties: 1,
                properties: {
                  titulo: { type: "string", minLength: 3, maxLength: 150 },
                  descricao: { type: "string", minLength: 10, maxLength: 10000 },
                  empresa: { type: "string", minLength: 2, maxLength: 150 },
                  tipo: { type: "string", enum: ["EMPREGO", "ESTAGIO", "PESQUISA", "OUTRO"] },
                  modalidade: { type: "string", enum: ["PRESENCIAL", "HIBRIDO", "REMOTO"] },
                  localizacao: { type: "string", nullable: true },
                  requisitos: { type: "array", items: { type: "string" } },
                  linkCandidatura: { type: "string", nullable: true },
                  emailContato: { type: "string", nullable: true },
                  expiraEm: { type: "string", format: "date-time", nullable: true },
                },
              },
              example: { titulo: "Desenvolvedor Backend Júnior" },
            },
          },
        },
        responses: {
          "200": { description: "Oportunidade atualizada." },
          "400": { description: "Dados inválidos." },
          "401": { description: "Não autenticado." },
          "403": { description: "Não é o autor da oportunidade." },
          "404": { description: "Oportunidade não encontrada." },
          "409": { description: "Oportunidade encerrada não pode ser editada." },
        },
      },
    },
    "/api/oportunidades/{id}/encerrar": {
      patch: {
        tags: ["Oportunidades"],
        summary: "Encerrar oportunidade",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Oportunidade encerrada." },
          "401": { description: "Não autenticado." },
          "403": { description: "Não é o autor da oportunidade." },
          "404": { description: "Oportunidade não encontrada." },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["Saúde"],
        summary: "Verificar saúde da API",
        responses: {
          "200": {
            description: "API funcionando.",
            content: {
              "application/json": {
                example: { status: "ok", application: "OportUna API" },
              },
            },
          },
        },
      },
    },
    "/api/health/db": {
      get: {
        tags: ["Saúde"],
        summary: "Verificar conexão com o banco",
        responses: {
          "200": {
            description: "Banco conectado.",
            content: {
              "application/json": {
                example: { status: "ok", database: "connected" },
              },
            },
          },
          "500": { description: "Banco desconectado." },
        },
      },
    },
  },
};
