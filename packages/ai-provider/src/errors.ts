export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class ProviderAuthError extends ProviderError {
  constructor(provider: string) {
    super(`Authentication failed for provider: ${provider}`, provider);
    this.name = 'ProviderAuthError';
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(
    provider: string,
    public readonly retryAfterMs?: number,
  ) {
    super(`Rate limit exceeded for provider: ${provider}`, provider);
    this.name = 'ProviderRateLimitError';
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(provider: string) {
    super(`Request timed out for provider: ${provider}`, provider);
    this.name = 'ProviderTimeoutError';
  }
}
