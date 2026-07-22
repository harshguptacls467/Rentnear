/**
 * Transform query results into a tabular format suitable for LLM consumption.
 * All values are converted to strings. Null/undefined become empty strings.
 *
 * @returns `{ columns: string[], rows: string[][] }`
 */
export function formatData(queryResult: Record<string, unknown>[]): {
  columns: string[];
  rows: string[][];
} {
  if (
    !Array.isArray(queryResult) ||
    queryResult.length === 0 ||
    !queryResult[0] ||
    typeof queryResult[0] !== "object"
  ) {
    return { columns: [], rows: [] };
  }

  const columns = Object.keys(queryResult[0]);
  const rows = queryResult.map((row) =>
    columns.map((col) => {
      const value = row[col];
      return value === null || value === undefined ? "" : String(value);
    }),
  );

  return { columns, rows };
}
