import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  provider: process.env.AI_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  baseUrl:
    process.env.GEMINI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta',
  chatModel:
    process.env.GEMINI_CHAT_MODEL ||
    process.env.OPENAI_CHAT_MODEL ||
    'gemini-2.0-flash',
  embeddingModel:
    process.env.GEMINI_EMBEDDING_MODEL ||
    process.env.OPENAI_EMBEDDING_MODEL ||
    'text-embedding-004',
  timeoutMs: Number(process.env.AI_TIMEOUT_MS || 5000),
  retryCount: Number(process.env.AI_RETRY_COUNT || 1),
  vectorSimilarityThreshold: 0.72,
  maxContextTokens: 1000,
}));
