import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'mandateguard.db');
const schemaPath = path.join(__dirname, 'schema.sql');

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbPath);

    // Run schema
    const schema = fs.readFileSync(schemaPath, 'utf8');
    dbInstance.exec(schema);
  }
  return dbInstance;
}

export function resetDatabase() {
  const db = getDb();
  db.exec(`
    DELETE FROM audit_log_entries;
    DELETE FROM recovery_actions;
    DELETE FROM failure_diagnoses;
    DELETE FROM charge_attempts;
    DELETE FROM mandates;
    DELETE FROM customers;
    DELETE FROM merchants;
    DELETE FROM batch_runs;
  `);
  return db;
}

export default getDb;
