import { Pool } from "pg";
import { DATABASE_URL } from "./secrets";

// Singleton PG pool shared across the server.
// Reusing a single pool avoids per-request connection leaks.
const pgPool = new Pool({
  connectionString: DATABASE_URL,
});

export default pgPool;
