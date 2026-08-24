import { OpenAIProvider } from './openai-provider.js';
import type { AIProvider } from './types.js';

export type ProviderName = 'openai';

export interface ProviderConfig {
  provider: ProviderName;
  apiKey: string;
  model: string;
}

export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config.apiKey, config.model);
    default: {
      const _exhaustive: never = config.provider;
      throw new Error(`Unknown provider: ${String(_exhaustive)}`);
    }
  }
}

export function createProviderFromEnv(): AIProvider {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is required');
  const model = process.env['OPENAI_MODEL'] ?? 'gpt-4.1-mini';
  return new OpenAIProvider(apiKey, model);
}
