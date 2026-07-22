/** Base error class for all OpenVizAI errors. */
export class OpenVizAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenVizAIError";
  }
}

/** Thrown when `prompt` or `data` input is missing or invalid. */
export class InvalidInputError extends OpenVizAIError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

/** Thrown when the LLM call fails or returns unparseable output. */
export class LLMError extends OpenVizAIError {
  constructor(message: string) {
    super(message);
    this.name = "LLMError";
  }
}

/** Thrown when the provider configuration is invalid (e.g. missing API key). */
export class ConfigError extends OpenVizAIError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
