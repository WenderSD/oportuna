import "dotenv/config";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";
import { tratarErros } from "./middlewares/tratarErros.js";
import oportunidadeRouter from "./routes/oportunidade.routes.js";
import usuarioRouter from "./routes/usuario.routes.js";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./docs-api/openapi.js";

z.config(z.locales.pt());

export const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", application: "OportUna API" });
});

app.use("/api/usuarios", usuarioRouter);
app.use("/api/oportunidades", oportunidadeRouter);

app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Falha ao consultar o banco:", error);
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ mensagem: "Rota não encontrada." });
});

app.use(tratarErros);
