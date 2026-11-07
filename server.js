import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const app = express();
const projectDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(projectDir, "public");
const assetsDir = path.join(publicDir, "assets");
const port = Number.parseInt(process.env.PORT || "3000", 10);
const databaseUrl = process.env.DATABASE_URL;
const allowedAssets = new Set(["app.css", "app.js", "back.png", "key.png", "logo.png", "question.png", "favicon.ico"]);

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DATABASE_SSL === "require" ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    })
  : null;

let databaseReady = false;

app.disable("x-powered-by");
app.use(express.json({ limit: "2kb", strict: true }));
app.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff"
  });
  next();
});

app.get("/", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));
app.get("assets/favicon.ico", (_req, res) => res.sendFile(path.join(publicDir, "assets/favicon.ico")));
app.get("/assets/:asset", (req, res, next) => {
  if (!allowedAssets.has(req.params.asset)) return next();
  return res.sendFile(path.join(assetsDir, req.params.asset));
});

app.get("/saude", async (_req, res) => {
  if (!pool || !databaseReady) {
    return res.status(503).json({ status: "indisponivel", database: "nao_configurado" });
  }

  try {
    await pool.query("SELECT 1");
    return res.json({ status: "ok", database: "conectado" });
  } catch {
    return res.status(503).json({ status: "indisponivel", database: "desconectado" });
  }
});

app.post("/api/respostas", async (req, res) => {
  if (!req.is("application/json")) {
    return res.status(415).json({ error: "content_type_invalido" });
  }

  const fields = Object.keys(req.body || {}).sort();
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const age = typeof req.body?.age === "string" ? req.body.age : "";
  const validFields = fields.length === 2 && fields[0] === "age" && fields[1] === "email";
  const validEmail = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validAge = age.length <= 254

  if (!validFields || !validEmail || !validAge) {
    return res.status(400).json({ error: "dados_invalidos" });
  }

  if (!pool || !databaseReady) {
    return res.status(503).json({ error: "database_indisponivel" });
  }

  try {
    await pool.query(
      `INSERT INTO cwg_responses (email, age)
       VALUES ($1, $2)
       ON CONFLICT (email)
       DO UPDATE SET age = EXCLUDED.age, updated_at = NOW()`,
      [email, age]
    );
    return res.status(201).json({ saved: true });
  } catch (error) {
    console.error("Failed to save CWG response:", error.code || "unknown_database_error");
    return res.status(500).json({ error: "falha_ao_salvar" });
  }
});

app.use((_req, res) => res.status(404).json({ error: "nao_encontrado" }));

async function initializeDatabase() {
  if (!pool) {
    console.warn("DATABASE_URL is not configured; submissions and health checks will be unavailable.");
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cwg_responses (
      id BIGSERIAL PRIMARY KEY,
      email VARCHAR(254) NOT NULL UNIQUE,
      age VARCHAR(254) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  databaseReady = true;
}

async function start() {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  await initializeDatabase();
  app.listen(port, "0.0.0.0", () => {
    console.log(`CWG form listening on port ${port}`);
  });
}

async function shutdown() {
  if (pool) await pool.end();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start().catch((error) => {
  console.error("Application startup failed:", error.code || error.message);
  process.exit(1);
});
