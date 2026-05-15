import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

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
    const data = await response.json();

    if (data.error) {
      console.error('API Error:', data.error.message);
      return;
    }

    console.log('Available models:');
    data.models.forEach((m: any) => {
      console.log(
        `- ${m.name} (methods: ${m.supportedGenerationMethods.join(', ')})`,
      );
    });
  } catch (error) {
    console.error('Fetch Error:', error.message);
  }
}

listModels();
