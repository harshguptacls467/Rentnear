/**
 * Sample a subset of rows from the dataset.
 */
export function sampleDataset(
  data: Record<string, unknown>[],
  sampleRows: number,
): Record<string, unknown>[] {
  return data.slice(0, sampleRows);
}
