import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType: string; data: string };
};
type GeminiContent = { role?: 'user' | 'model'; parts: GeminiPart[] };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: string;
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly retryCount: number;
  private chatModelName: string;
  private embeddingModelName: string;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get<string>('ai.provider') || 'gemini';
    this.apiKey =
      this.configService.get<string>('ai.geminiApiKey') ||
      this.configService.get<string>('ai.openaiApiKey') ||
      undefined;
    this.baseUrl =
      this.configService.get<string>('ai.baseUrl') ||
      'https://generativelanguage.googleapis.com/v1beta';
    this.timeoutMs = this.configService.get<number>('ai.timeoutMs') || 15000;
    this.retryCount = this.configService.get<number>('ai.retryCount') || 3;
    this.chatModelName =
      this.configService.get<string>('ai.chatModel') || 'gemini-2.0-flash';
    this.embeddingModelName =
      this.configService.get<string>('ai.embeddingModel') ||
      'text-embedding-004';

    void this.initModels();
  }

  private async initModels() {
    if (!this.apiKey || this.provider !== 'gemini') return;

    const startedAt = Date.now();
    const data = await this.getJson<{ models?: any[] }>(
      `${this.baseUrl}/models?key=${this.apiKey}`,
      this.timeoutMs,
      0,
    );

    if (!data?.models) {
      this.logger.warn(
        'AiService model detection skipped. Using configured models.',
      );
      return;
    }

    const flashModels = data.models.filter(
      (model) =>
        Array.isArray(model.supportedGenerationMethods) &&
        model.supportedGenerationMethods.includes('generateContent') &&
        String(model.name || '').includes('flash'),
    );

    const chatModel =
      flashModels.find((model) =>
        String(model.name || '').includes('gemini-2.5-flash'),
      ) ||
      flashModels.find((model) =>
        String(model.name || '').includes('gemini-1.5-flash'),
      ) ||
      flashModels.find((model) =>
        String(model.name || '').includes('gemini-2.0'),
      ) ||
      flashModels[0];

    if (chatModel?.name) {
      this.chatModelName = String(chatModel.name).replace('models/', '');
    }

    const embedModel = data.models.find(
      (model) =>
        String(model.name || '').includes('text-embedding-004') ||
        model.supportedGenerationMethods?.includes('embedContent'),
    );
    if (embedModel?.name) {
      this.embeddingModelName = String(embedModel.name).replace('models/', '');
    }

    this.logger.log(
      `AiService initialized provider=${this.provider} chat=${this.chatModelName} embed=${this.embeddingModelName} latency=${Date.now() - startedAt}ms`,
    );
  }

  async createEmbedding(text: string): Promise<number[] | null> {
    if (!this.apiKey || this.provider !== 'gemini') return null;

    const data = await this.postJson<{ embedding?: { values?: number[] } }>(
      this.geminiUrl(this.embeddingModelName, 'embedContent'),
      { content: { parts: [{ text }] } },
      this.timeoutMs,
    );

    const values = data?.embedding?.values;
    if (!values) return null;

    if (values.length !== 768) {
      this.logger.warn(
        `Embedding dimension mismatch: expected 768, got ${values.length}`,
      );
    }

    return values.slice(0, 768);
  }

  async chat(
    message: string,
    context: string,
    history: Array<{
      role?: string;
      content?: string;
      parts?: Array<{ text?: string }>;
    }> = [],
  ): Promise<string> {
    if (!this.apiKey || this.provider !== 'gemini')
      return this.getFallbackMessage();

    const contents: GeminiContent[] = history
      .slice(-8)
      .map((item): GeminiContent => {
        const role: 'user' | 'model' =
          item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';
        return {
          role,
          parts: [{ text: item.content || item.parts?.[0]?.text || '' }],
        };
      })
      .filter((item) => Boolean(item.parts[0].text?.trim()));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const text = await this.generateText(contents, {
      parts: [
        {
          text:
            'Bạn là trợ lý ảo của HomeService Marketplace. Trả lời tiếng Việt ngắn gọn, rõ ràng, không bịa dữ liệu. ' +
            'Chỉ nhắc tới dịch vụ, giá, nhà cung cấp, trạng thái nếu có trong dữ liệu hệ thống bên dưới.\n\n' +
            `Dữ liệu hệ thống:\n${context}`,
        },
      ],
    });

    return text || this.getFallbackMessage();
  }

  async analyzeDispute(
    reason: string,
  ): Promise<{ category: string; severity: string; summary: string } | null> {
    if (!this.apiKey || this.provider !== 'gemini') return null;

    const prompt = `Phân tích khiếu nại sau của khách hàng trên hệ thống Service Marketplace.
Khiếu nại: "${reason}"

Phân loại category vào 1 trong 4 nhóm: "Chất lượng dịch vụ", "Thái độ", "Giá cả", "Khác".
Phân loại severity vào 1 trong 3 mức: "Cao", "Trung bình", "Thấp".
Tóm tắt ngắn gọn dưới 30 chữ.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        category: { type: 'STRING', enum: ['Chất lượng dịch vụ', 'Thái độ', 'Giá cả', 'Khác'] },
        severity: { type: 'STRING', enum: ['Cao', 'Trung bình', 'Thấp'] },
        summary: { type: 'STRING' }
      },
      required: ['category', 'severity', 'summary']
    };

    try {
      const result = await this.generateJson<{ category: string; severity: string; summary: string }>(
        prompt, 
        this.timeoutMs * 2,
        schema
      );
      if (!result) return { category: 'Khác', severity: 'Trung bình', summary: 'Không thể phân tích tự động' };
      return result;
    } catch {
      return { category: 'Khác', severity: 'Trung bình', summary: 'Không thể phân tích tự động' };
    }
  }

  async suggestReplies(messages: string[]): Promise<string[]> {
    if (!this.apiKey || this.provider !== 'gemini') return [];

    const prompt = `Dựa vào đoạn hội thoại sau giữa Khách hàng và Thợ, hãy gợi ý 3 câu trả lời ngắn gọn dưới 10 chữ cho Thợ.
Đoạn hội thoại:
${messages.map((message) => `- ${message}`).join('\n')}`;

    const schema = {
      type: 'ARRAY',
      items: { type: 'STRING' }
    };

    const result = await this.generateJson<string[]>(
      prompt,
      this.timeoutMs * 2,
      schema
    );
    return Array.isArray(result) ? result.slice(0, 3) : [];
  }

  async moderateReview(comment: string): Promise<boolean> {
    if (!this.apiKey || this.provider !== 'gemini') return false;

    const prompt = `Phân tích bình luận sau. Trả về true nếu bình luận chứa chửi thề, độc hại, lăng mạ, hoặc spam link. Trả về false nếu bình thường.
Bình luận: "${comment}"`;

    const schema = {
      type: 'OBJECT',
      properties: {
        isToxic: { type: 'BOOLEAN' }
      },
      required: ['isToxic']
    };

    const result = await this.generateJson<{ isToxic?: boolean }>(
      prompt,
      this.timeoutMs * 2,
      schema
    );
    return result?.isToxic === true;
  }

  async analyzeResultImage(
    serviceName: string,
    base64Image: string,
    mimeType: string,
  ): Promise<boolean> {
    if (!this.apiKey || this.provider !== 'gemini') return true;

    const prompt = `Đây là ảnh nghiệm thu cho dịch vụ "${serviceName}".
Kiểm tra ảnh có phù hợp với dịch vụ không. Nếu ảnh tối, che khuất hoàn toàn, hoặc không liên quan, trả về false. Nếu hợp lý hoặc có vẻ hợp lý, trả về true.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        isValid: { type: 'BOOLEAN' }
      },
      required: ['isValid']
    };

    const data = await this.postJson<GeminiResponse>(
      this.geminiUrl(this.chatModelName, 'generateContent'),
      {
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Image } },
            ],
          },
        ],
        generationConfig: { 
          responseMimeType: 'application/json',
          responseSchema: schema
        },
      },
      this.timeoutMs * 3,
    );

    const text = this.extractText(data);
    const result = text
      ? this.safeJsonParse<{ isValid?: boolean }>(text)
      : null;
    return typeof result?.isValid === 'boolean' ? result.isValid : true;
  }

  private async generateJson<T>(
    prompt: string,
    timeoutMs: number,
    schema?: Record<string, unknown>,
  ): Promise<T | null> {
    const generationConfig: Record<string, unknown> = { responseMimeType: 'application/json' };
    if (schema) {
      generationConfig.responseSchema = schema;
    }

    const text = await this.generateText(
      [{ role: 'user', parts: [{ text: prompt }] }],
      undefined,
      generationConfig,
      timeoutMs,
    );
    return text ? this.safeJsonParse<T>(text) : null;
  }

  private async generateText(
    contents: GeminiContent[],
    systemInstruction?: { parts: Array<{ text: string }> },
    generationConfig?: Record<string, unknown>,
    timeoutMs = 15000,
  ): Promise<string | null> {
    const startedAt = Date.now();
    const data = await this.postJson<GeminiResponse>(
      this.geminiUrl(this.chatModelName, 'generateContent'),
      {
        contents,
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(generationConfig ? { generationConfig } : {}),
      },
      timeoutMs,
    );

    const text = this.extractText(data);
    this.logger.log(
      `AI generateContent model=${this.chatModelName} latency=${Date.now() - startedAt}ms ok=${Boolean(text)}`,
    );
    return text;
  }

  private async getJson<T>(
    url: string,
    timeoutMs: number,
    retryCount = this.retryCount,
  ): Promise<T | null> {
    return this.requestJson<T>('GET', url, undefined, timeoutMs, retryCount);
  }

  private async postJson<T>(
    url: string,
    body: unknown,
    timeoutMs: number,
    retryCount = this.retryCount,
  ): Promise<T | null> {
    return this.requestJson<T>('POST', url, body, timeoutMs, retryCount);
  }

  private async requestJson<T>(
    method: 'GET' | 'POST',
    url: string,
    body: unknown,
    timeoutMs: number,
    retryCount: number,
  ): Promise<T | null> {
    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const startedAt = Date.now();

      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        const data = (await response.json()) as T & {
          error?: { message?: string };
        };

        if (!response.ok) {
          throw new Error(
            data.error?.message || `AI request failed ${response.status}`,
          );
        }

        this.logger.debug?.(
          `AI ${method} latency=${Date.now() - startedAt}ms attempt=${attempt + 1}`,
        );
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt >= retryCount) {
          this.logger.warn(
            `AI request failed after ${attempt + 1} attempt(s): ${message}`,
          );
          return null;
        }
        
        const backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 8000);
        this.logger.warn(
          `AI request failed (attempt ${attempt + 1}/${retryCount + 1}), retrying in ${Math.round(backoffMs)}ms. Error: ${message}`,
        );
        await this.sleep(backoffMs);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    return null;
  }

  private geminiUrl(model: string, method: string) {
    return `${this.baseUrl}/models/${model}:${method}?key=${this.apiKey}`;
  }

  private extractText(data: GeminiResponse | null): string | null {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  }

  private safeJsonParse<T>(text: string): T | null {
    try {
      // Dọn dẹp markdown block
      const cleaned = text
        .trim()
        .replace(/^```(json)?/im, '')
        .replace(/```$/im, '')
        .trim();

      // Thử parse toàn bộ trước
      try {
        return JSON.parse(cleaned) as T;
      } catch (e) {
        // Nếu lỗi, cố gắng bóc tách mảng hoặc object
        const objectStart = cleaned.indexOf('{');
        const arrayStart = cleaned.indexOf('[');
        const start =
          objectStart === -1
            ? arrayStart
            : arrayStart === -1
              ? objectStart
              : Math.min(objectStart, arrayStart);
        const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
        
        if (start >= 0 && end >= start) {
          const json = cleaned.slice(start, end + 1);
          return JSON.parse(json) as T;
        }
        throw e;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`AI JSON parse failed: ${message}. Raw text: ${text.slice(0, 100)}...`);
      return null;
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getFallbackMessage(): string {
    return 'Xin lỗi, hệ thống AI đang bận hoặc phản hồi chậm. Vui lòng thử lại sau giây lát.';
  }
}
