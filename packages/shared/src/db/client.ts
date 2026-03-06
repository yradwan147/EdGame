import Surreal from "surrealdb";

let db: Surreal | null = null;

export async function getDb(): Promise<Surreal> {
  if (db) return db;

  db = new Surreal();

  const endpoint = process.env.SURREALDB_URL || "http://localhost:8000";
  await db.connect(endpoint);

  await db.use({
    namespace: process.env.SURREALDB_NS || "edgame",
    database: process.env.SURREALDB_DB || "production",
  });

  const user = process.env.SURREALDB_USER || "root";
  const pass = process.env.SURREALDB_PASS || "root";
  await db.signin({ username: user, password: pass });

  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}
