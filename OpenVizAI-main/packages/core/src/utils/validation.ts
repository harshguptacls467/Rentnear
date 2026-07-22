import type { AnalyzeChartInput } from "../types/api.js";
import { InvalidInputError } from "../errors/index.js";

/**
 * Validate the input to `analyzeChart`.
 */
export function validateInput(input: AnalyzeChartInput): void {
  if (!input.prompt || typeof input.prompt !== "string") {
    throw new InvalidInputError("prompt must be a non-empty string");
  }

  if (!Array.isArray(input.data) || input.data.length === 0) {
    throw new InvalidInputError("data must be a non-empty array of objects");
  }

  const first = input.data[0];
  if (!first || typeof first !== "object" || Array.isArray(first)) {
    throw new InvalidInputError("data items must be plain objects");
  }

  const keys = Object.keys(first);
  if (keys.length === 0) {
    throw new InvalidInputError("data objects must have at least one field");
  }
}
