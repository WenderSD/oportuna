import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import usuarioRouter from "./routes/usuario.routes.js";
import { tratarErros } from "./middlewares/tratarErros.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    application: "OportUna API",
  });
});

app.use("/api/usuarios", usuarioRouter);

// TODO: rota de teste de outra pessoa do grupo, comentada porque o alert() não existe no Node
// e ela nunca responde. O Back B vai substituir pelo módulo de oportunidades.
// app.post("/api/oportunidade", (_req, _res) => {
//   let request = _req.body;
//   alert(request.text);
// });

app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Falha ao consultar o banco:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

// Sempre depois de todas as rotas
app.use(tratarErros);

app.listen(PORT, () => {
  console.log(`OportUna API executando em http://localhost:${PORT}`);
});