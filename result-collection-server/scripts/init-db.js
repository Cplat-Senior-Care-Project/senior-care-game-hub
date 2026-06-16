const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

loadEnvFile(path.join(__dirname, "..", ".env"));

const dataDir = path.resolve(process.env.DATA_DIR || path.join(__dirname, "..", "data"));
const dbPath = path.resolve(process.env.DB_PATH || path.join(dataDir, "game-results.sqlite"));
const schemaFile = path.join(__dirname, "..", "schema.sql");

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(path.join(dataDir, "sessions"), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");
db.exec(fs.readFileSync(schemaFile, "utf8"));
runMigrations(db);
db.close();

console.log(`Initialized result collection DB: ${dbPath}`);

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}

function runMigrations(db) {
  ensureColumns(db, "game_play_results", {
    event_type: "TEXT",
    tenant_id: "TEXT",
    facility_id: "TEXT",
    program_id: "TEXT",
    reward_id: "TEXT",
    recommendation_id: "TEXT",
    process_data_json: "TEXT",
  });

  createUniqueIndexIfSafe(
    db,
    "idx_game_play_results_session_unique",
    "game_play_results",
    "session_id",
    "session_id IS NOT NULL"
  );
  createUniqueIndexIfSafe(
    db,
    "idx_game_play_results_assignment_session_unique",
    "game_play_results",
    "assignment_id, session_id",
    "assignment_id IS NOT NULL"
  );

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_game_play_results_tenant
      ON game_play_results(tenant_id)
      WHERE tenant_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_game_play_results_facility
      ON game_play_results(facility_id)
      WHERE facility_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_game_play_results_program
      ON game_play_results(program_id)
      WHERE program_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_game_play_results_recommendation
      ON game_play_results(recommendation_id)
      WHERE recommendation_id IS NOT NULL;
  `);
}

function ensureColumns(db, table, columns) {
  const existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name));
  for (const [name, definition] of Object.entries(columns)) {
    if (!existing.has(name)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    }
  }
}

function createUniqueIndexIfSafe(db, indexName, table, columns, whereClause) {
  const duplicate = db.prepare(`
    SELECT 1
      FROM ${table}
     WHERE ${whereClause}
     GROUP BY ${columns}
    HAVING COUNT(*) > 1
     LIMIT 1
  `).get();

  if (!duplicate) {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${table}(${columns}) WHERE ${whereClause}`);
  }
}
