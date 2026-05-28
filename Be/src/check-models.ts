import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

interface GeminiModelsResponse {
  models?: Array<{
    name: string;
    supportedGenerationMethods?: string[];
  }>;
  error?: {
    message?: string;
  };
}

async function listModels() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Missing API Key in .env');
    return;
  }

  try {
    // Thử với fetch trực tiếp để kiểm tra API Key
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = (await response.json()) as GeminiModelsResponse;

    if (data.error) {
      console.error('API Error:', data.error.message ?? 'Unknown error');
      return;
    }

    console.log('Available models:');
    data.models?.forEach((m) => {
      console.log(
        `- ${m.name} (methods: ${(m.supportedGenerationMethods ?? []).join(', ')})`,
      );
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Fetch Error:', message);
  }
}

void listModels();
