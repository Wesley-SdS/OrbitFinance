export class AssistantError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = "AssistantError"
  }
}

export class ValidationError extends AssistantError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details)
    this.name = "ValidationError"
  }
}

export class MediaProcessingError extends AssistantError {
  constructor(message: string, details?: unknown) {
    super(message, "MEDIA_PROCESSING_ERROR", 500, details)
    this.name = "MediaProcessingError"
  }
}

export class TransactionCreationError extends AssistantError {
  constructor(message: string, details?: unknown) {
    super(message, "TRANSACTION_CREATION_ERROR", 500, details)
    this.name = "TransactionCreationError"
  }
}

export class NLUParsingError extends AssistantError {
  constructor(message: string, details?: unknown) {
    super(message, "NLU_PARSING_ERROR", 400, details)
    this.name = "NLUParsingError"
  }
}

export class ProviderError extends AssistantError {
  constructor(message: string, details?: unknown) {
    super(message, "PROVIDER_ERROR", 500, details)
    this.name = "ProviderError"
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AssistantError) {
    return error.statusCode >= 500 && error.statusCode < 600
  }

  if (error instanceof Error) {
    const retryableMessages = ["ETIMEDOUT", "ECONNRESET", "ENOTFOUND", "ECONNREFUSED"]
    return retryableMessages.some((msg) => error.message.includes(msg))
  }

  return false
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export function logError(context: string, error: unknown, metadata?: Record<string, unknown>): void {
  console.error(`[${context}]`, {
    error: getErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...metadata,
  })
}
