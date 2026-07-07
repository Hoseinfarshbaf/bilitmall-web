import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

const psqlCandidates = [
  process.env.PSQL_PATH,
  "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe",
  "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
  "psql",
].filter(Boolean);

const psqlPath = psqlCandidates.find((candidate) => {
  if (candidate === "psql") return true;
  return fs.existsSync(candidate);
});

if (!psqlPath) {
  console.error("psql executable not found. Set PSQL_PATH in your environment.");
  process.exit(1);
}

const sqlFile = path.join(process.cwd(), "scripts", "create-postgres-db.sql");
const databaseUrl = process.env.DATABASE_URL;
const password = databaseUrl ? new URL(databaseUrl).password : process.env.POSTGRES_PASSWORD ?? "";

const result = spawnSync(
  psqlPath,
  ["-U", "postgres", "-h", "localhost", "-p", "5432", "-f", sqlFile],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PGPASSWORD: password,
    },
  }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('Database "bilitmall-web" is ready.');
