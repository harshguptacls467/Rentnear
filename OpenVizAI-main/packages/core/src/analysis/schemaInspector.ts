/** A single column descriptor with an inferred type. */
export interface SchemaColumn {
  /** Column name (key from the data objects). */
  name: string;
  /** Inferred type based on the first non-null value. */
  type: "string" | "number" | "boolean" | "date" | "null" | "unknown";
}

/** Schema info for a dataset sample — column descriptors + row count. */
export interface SchemaInfo {
  /** Array of column descriptors. */
  columns: SchemaColumn[];
  /** Number of rows in the sample. */
  rowCount: number;
}

function inferType(value: unknown): SchemaColumn["type"] {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") {
    // Check for ISO date-like patterns
    if (!isNaN(Date.parse(value)) && /\d{4}[-/]\d{2}[-/]\d{2}/.test(value)) {
      return "date";
    }
    return "string";
  }
  return "unknown";
}

/**
 * Inspect the schema of a dataset sample.
 *
 * Infers column names and types from the first non-null value encountered
 * in each column. Useful for passing schema hints to the LLM.
 *
 * @param sample - Array of data objects to inspect.
 * @returns Schema info with column descriptors and row count.
 *
 * @example
 * ```ts
 * const schema = inspectSchema([
 *   { date: "2023-01-01", revenue: 1000 },
 *   { date: "2023-02-01", revenue: 1500 },
 * ]);
 * // schema.columns → [{ name: "date", type: "date" }, { name: "revenue", type: "number" }]
 * ```
 */
export function inspectSchema(sample: Record<string, unknown>[]): SchemaInfo {
  if (sample.length === 0) {
    return { columns: [], rowCount: 0 };
  }

  const columnNames = Object.keys(sample[0]);
  const columns: SchemaColumn[] = columnNames.map((name) => {
    // Find the first non-null value to infer type
    for (const row of sample) {
      const val = row[name];
      if (val !== null && val !== undefined) {
        return { name, type: inferType(val) };
      }
    }
    return { name, type: "null" };
  });

  return { columns, rowCount: sample.length };
}
