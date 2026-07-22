const TURSO_URL = process.env.TURSO_URL || process.env.DATABASE_URL || "";
const TURSO_AUTH = process.env.TURSO_AUTH_TOKEN || "";

export interface TransactionRow {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: "Доход" | "Расход";
  date: string;
  createdAt: string;
  userId: string | null;
}

async function tursoExecute(sql: string, args: unknown[] = []) {
  const url = TURSO_URL.startsWith("libsql://") 
    ? TURSO_URL.replace("libsql://", "https://") + "/v2/pipeline"
    : TURSO_URL;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TURSO_AUTH}`,
    },
    body: JSON.stringify({
      statements: [{ sql, args }],
    }),
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Turso error: ${response.status} - ${err}`);
  }
  
  return response.json();
}

export async function getTransactions(weekAgoStr: string): Promise<TransactionRow[]> {
  const result = await tursoExecute(
    "SELECT id, title, amount, category, type, date, createdAt, userId FROM transactions WHERE date >= ? ORDER BY date DESC",
    [weekAgoStr]
  );
  
  return result.results?.[0]?.rows || [];
}