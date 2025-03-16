import fs from "fs";
import path from "path";

const migrationName = process.argv[2];
if (!migrationName) {
  console.error("Please provide a migration name");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
const filename = `${timestamp}_${migrationName}.sql`;
const migrationsDir = path.join(process.cwd(), "src", "db", "migrations");

// Create migrations directory if it doesn't exist
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const template = `-- Up Migration
-- Write your UP migration SQL here

-- Down Migration
-- Write your DOWN migration SQL here
`;

fs.writeFileSync(path.join(migrationsDir, filename), template);
console.log(`Created migration: ${filename}`);
