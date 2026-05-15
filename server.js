const path = require("path");
const fs = require("fs");
const express = require("express");
const { DatabaseSync } = require("node:sqlite");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "curriculos.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS curriculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cadastrado_em TEXT NOT NULL,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    payload_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_curriculos_email ON curriculos(email);
  CREATE INDEX IF NOT EXISTS idx_curriculos_cadastrado ON curriculos(cadastrado_em);
`);

const app = express();
app.use(express.json({ limit: "15mb" }));

app.post("/api/curriculos", (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ erro: "Corpo da requisição inválido." });
  }
  const dp = body.dadosPessoais;
  if (!dp || typeof dp !== "object") {
    return res.status(400).json({ erro: "Campo dadosPessoais é obrigatório." });
  }
  const nome = String(dp.nome || "").trim();
  const email = String(dp.email || "").trim();
  const telefone = String(dp.telefone || "").trim();
  if (!nome || !email || !telefone) {
    return res.status(400).json({ erro: "Nome, e-mail e telefone são obrigatórios." });
  }
  const cadastradoEm = String(body.cadastradoEm || new Date().toISOString());
  const payloadJson = JSON.stringify(body);
  const stmt = db.prepare(
    "INSERT INTO curriculos (cadastrado_em, nome, email, telefone, payload_json) VALUES (?, ?, ?, ?, ?)"
  );
  const info = stmt.run(cadastradoEm, nome, email, telefone, payloadJson);
  const rowid = typeof info.lastInsertRowid === "bigint" ? Number(info.lastInsertRowid) : info.lastInsertRowid;
  res.status(201).json({ id: rowid, cadastradoEm });
});

app.get("/api/curriculos", (_req, res) => {
  const rows = db
    .prepare(
      "SELECT id, cadastrado_em AS cadastradoEm, nome, email, telefone FROM curriculos ORDER BY id DESC"
    )
    .all();
  res.json(rows);
});

app.get("/api/curriculos/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ erro: "Identificador inválido." });
  }
  const row = db.prepare("SELECT * FROM curriculos WHERE id = ?").get(id);
  if (!row) {
    return res.status(404).json({ erro: "Registro não encontrado." });
  }
  res.json({
    id: row.id,
    cadastradoEm: row.cadastrado_em,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    payload: JSON.parse(row.payload_json),
  });
});

app.use(express.static(ROOT));

app.listen(PORT, () => {
  console.log(`Cadastro de currículos — http://localhost:${PORT}`);
  console.log(`Base SQLite: ${DB_PATH}`);
});
