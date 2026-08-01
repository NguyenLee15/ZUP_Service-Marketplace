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
type GeminiModel = {
  name?: string;
  supportedGenerationMethods?: string[];
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
    const data = await this.getJson<{ models?: GeminiModel[] }>(
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

  getState() {
    return {
      provider: this.provider,
      chatModel: this.chatModelName,
      embedModel: this.embeddingModelName,
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 5) : null,
    };
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
            'Bạn là trợ lý ảo của HomeService Marketplace. Hãy trả lời BẰNG TIẾNG VIỆT, THẬT NGẮN GỌN (tối đa 2-3 câu), thân thiện và trực tiếp vào vấn đề. ' +
            'TUYỆT ĐỐI KHÔNG dài dòng, KHÔNG giải thích dông dài. KHÔNG dùng định dạng Markdown (như ** hay ##). Dùng dấu gạch ngang (-) xuống dòng nếu cần liệt kê để dễ đọc. ' +
            'Chỉ cung cấp thông tin dựa trên dữ liệu hệ thống bên dưới, không tự bịa thêm.\n\n' +
            `Dữ liệu hệ thống:\n${context}`,
        },
      ],
    });

    return text || this.getFallbackMessage();
  }

  async analyzeDispute(
    reason: string,
  ): Promise<{
    category: string;
    severity: string;
    summary: string;
    confidence: number;
    recommendation: string;
    evidencePoints: { type: string; text: string }[];
    anomalies: { type: string; text: string }[];
  } | null> {
    if (!this.apiKey || this.provider !== 'gemini') return null;

    const prompt = `Phân tích khiếu nại sau của khách hàng trên hệ thống Service Marketplace.
Khiếu nại: "${reason}"

Yêu cầu trả về JSON có cấu trúc sau:
- category: "Chất lượng dịch vụ", "Thái độ", "Giá cả", hoặc "Khác"
- severity: "Cao", "Trung bình", "Thấp"
- summary: Tóm tắt ngắn gọn dưới 30 chữ
- confidence: Độ tin cậy (0-100)
- recommendation: Đề xuất hành động cho Admin
- evidencePoints: Mảng các điểm bằng chứng (type: "positive" | "negative" | "neutral", text: string)
- anomalies: Mảng các điểm bất thường (type: "warning" | "critical", text: string)
`;

    const schema = {
      type: 'OBJECT',
      properties: {
        category: { type: 'STRING' },
        severity: { type: 'STRING' },
        summary: { type: 'STRING' },
        confidence: { type: 'INTEGER' },
        recommendation: { type: 'STRING' },
        evidencePoints: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              type: { type: 'STRING' },
              text: { type: 'STRING' }
            }
          }
        },
        anomalies: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              type: { type: 'STRING' },
              text: { type: 'STRING' }
            }
          }
        }
      },
      required: ['category', 'severity', 'summary', 'confidence', 'recommendation', 'evidencePoints', 'anomalies'],
    };

    try {
      const result = await this.generateJson<any>(prompt, this.timeoutMs * 2, schema);
      if (!result) return null;
      return result;
    } catch {
      return null;
    }
  }

  async extractBookingIntent(
    userPrompt: string,
  ): Promise<{
    categoryName: string;
    keywords: string[];
    summary: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedBudgetMin?: number;
    estimatedBudgetMax?: number;
  } | null> {
    if (!this.apiKey || this.provider !== 'gemini') return null;

    const prompt = `Phân tích yêu cầu dịch vụ sửa chữa gia đình sau từ khách hàng và trích xuất thông tin cấu trúc:
Yêu cầu: "${userPrompt}"

Hãy bóc tách thành JSON chuẩn với các trường:
- categoryName: Tên danh mục dịch vụ phù hợp nhất (ví dụ: Điện lạnh, Điện nước, Sửa máy giặt, Sửa tủ lạnh, Sửa điều hòa, Vệ sinh nhà cửa, Sửa chữa đồ gỗ...)
- keywords: Mảng các từ khóa cốt lõi chỉ loại thiết bị/sự cố (ví dụ: ["máy giặt", "kêu to", "không vắt"])
- summary: Tóm tắt sự cố chuẩn hóa ngắn gọn dưới 35 chữ
- urgency: Mức độ khẩn cấp ("HIGH" nếu cần gấp/rò rỉ/chập điện, "MEDIUM" nếu hỏng hóc thông thường, "LOW" nếu dịch vụ định kỳ)
- estimatedBudgetMin: Ngân sách tối thiểu ước tính bằng VND (nếu có đề cập hoặc đoán được, ví dụ 100000)
- estimatedBudgetMax: Ngân sách tối đa ước tính bằng VND (nếu có đề cập hoặc đoán được, ví dụ 500000)
`;

    const schema = {
      type: 'OBJECT',
      properties: {
        categoryName: { type: 'STRING' },
        keywords: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
        summary: { type: 'STRING' },
        urgency: { type: 'STRING' },
        estimatedBudgetMin: { type: 'INTEGER' },
        estimatedBudgetMax: { type: 'INTEGER' },
      },
      required: ['categoryName', 'keywords', 'summary', 'urgency'],
    };

    try {
      const result = await this.generateJson<{
        categoryName: string;
        keywords: string[];
        summary: string;
        urgency: 'HIGH' | 'MEDIUM' | 'LOW';
        estimatedBudgetMin?: number;
        estimatedBudgetMax?: number;
      }>(prompt, this.timeoutMs * 2, schema);
      if (!result || !result.categoryName) return null;
      return result;
    } catch (err) {
      this.logger.error(`Failed to extract booking intent via Gemini: ${err}`);
      return null;
    }
  }


  async suggestReplies(messages: string[]): Promise<string[]> {
    if (!this.apiKey || this.provider !== 'gemini') return [];

    const prompt = `Dựa vào đoạn hội thoại sau giữa Khách hàng và Thợ, hãy gợi ý 3 câu trả lời ngắn gọn dưới 10 chữ cho Thợ.
Đoạn hội thoại:
${messages.map((message) => `- ${message}`).join('\n')}`;

    const schema = {
      type: 'ARRAY',
      items: { type: 'STRING' },
    };

    const result = await this.generateJson<string[]>(
      prompt,
      this.timeoutMs * 2,
      schema,
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
        isToxic: { type: 'BOOLEAN' },
      },
      required: ['isToxic'],
    };

    const result = await this.generateJson<{ isToxic?: boolean }>(
      prompt,
      this.timeoutMs * 2,
      schema,
    );
    return result?.isToxic === true;
  }

  async generateServiceDescription(
    name: string,
    keywords?: string,
  ): Promise<string | null> {
    if (!this.apiKey || this.provider !== 'gemini') return null;

    let prompt = `Đóng vai một chuyên gia marketing cho thợ sửa chữa gia đình, hãy viết một đoạn mô tả dịch vụ cho dịch vụ có tên: "${name}".`;
    if (keywords) {
      prompt += `\nHãy đảm bảo nhắc đến các từ khoá sau: "${keywords}".`;
    }
    prompt += `\nYêu cầu:
- Viết bằng tiếng Việt, giọng văn chuyên nghiệp, thuyết phục.
- Dài khoảng 3-4 đoạn, có dùng biểu tượng cảm xúc (emoji) cho sinh động.
- Dùng gạch đầu dòng cho các ưu điểm hoặc cam kết.
- Tuyệt đối KHÔNG được thêm các câu rào trước đón sau như "Đây là mô tả của bạn:", "Chắc chắn rồi", v.v. Trả về trực tiếp nội dung mô tả để copy/paste luôn.`;

    const text = await this.generateText(
      [{ role: 'user', parts: [{ text: prompt }] }],
      undefined,
      undefined,
      this.timeoutMs * 2,
    );
    return text;
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
        isValid: { type: 'BOOLEAN' },
      },
      required: ['isValid'],
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
          responseSchema: schema,
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
    const generationConfig: Record<string, unknown> = {
      responseMimeType: 'application/json',
    };
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

        const backoffMs = Math.min(
          1000 * Math.pow(2, attempt) + Math.random() * 500,
          8000,
        );
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
        const end = Math.max(
          cleaned.lastIndexOf('}'),
          cleaned.lastIndexOf(']'),
        );

        if (start >= 0 && end >= start) {
          const json = cleaned.slice(start, end + 1);
          return JSON.parse(json) as T;
        }
        throw e;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `AI JSON parse failed: ${message}. Raw text: ${text.slice(0, 100)}...`,
      );
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
