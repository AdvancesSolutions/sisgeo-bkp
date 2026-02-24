import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { AiCheckResult } from '../../entities/ai-check-result.entity';
import { TaskPhoto } from '../../entities/task-photo.entity';

export interface AiCheckResponse {
  status: 'APROVADO' | 'REPROVADO' | 'INDETERMINADO';
  confidence: number;
  details?: {
    manchasDetectadas?: boolean;
    sujeiraResidual?: boolean;
    observacoes?: string[];
  };
}

@Injectable()
export class AiVisionService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AiCheckResult)
    private readonly aiCheckRepo: Repository<AiCheckResult>,
    @InjectRepository(TaskPhoto)
    private readonly taskPhotoRepo: Repository<TaskPhoto>,
  ) {}

  /**
   * Valida foto de limpeza (Depois) via Webhook ou Gemini.
   * Retorna feedback instantâneo: APROVADO | REPROVADO | INDETERMINADO
   */
  async validateCleaningPhoto(
    taskPhotoId: string,
    imageUrl: string,
  ): Promise<AiCheckResponse & { aiCheckId?: string }> {
    const webhookUrl = this.config.get<string>('AI_VISION_WEBHOOK_URL');
    const geminiKey = this.config.get<string>('GOOGLE_AI_API_KEY');

    let result: AiCheckResponse;

    if (webhookUrl) {
      result = await this.callWebhook(webhookUrl, imageUrl);
    } else if (geminiKey) {
      result = await this.callGemini(geminiKey, imageUrl);
    } else {
      return {
        status: 'INDETERMINADO',
        confidence: 0,
        details: { observacoes: ['IA não configurada. Defina AI_VISION_WEBHOOK_URL ou GOOGLE_AI_API_KEY.'] },
      };
    }

    const aiCheck = this.aiCheckRepo.create({
      id: uuid(),
      taskPhotoId,
      provider: webhookUrl ? 'WEBHOOK' : 'GEMINI',
      status: result.status,
      confidence: result.confidence,
      details: result.details ?? null,
    });
    await this.aiCheckRepo.save(aiCheck);

    return { ...result, aiCheckId: aiCheck.id };
  }

  private async callWebhook(url: string, imageUrl: string): Promise<AiCheckResponse> {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
      signal: ctrl.signal,
    });
    clearTimeout(timeout);
    const data = (await res.json()) as AiCheckResponse;
    return {
      status: data.status ?? 'INDETERMINADO',
      confidence: data.confidence ?? 0,
      details: data.details,
    };
  }

  private async callGemini(apiKey: string, imageUrl: string): Promise<AiCheckResponse> {
    try {
      const imageBase64 = await this.fetchImageAsBase64(imageUrl);
      const prompt = `Analise esta imagem de limpeza (foto "Depois"). 
Responda em JSON com: 
- status: "APROVADO" se não houver manchas ou sujeira residual visível, "REPROVADO" se houver, "INDETERMINADO" se não conseguir avaliar.
- confidence: 0 a 1 (certeza da análise)
- details: { manchasDetectadas: boolean, sujeiraResidual: boolean, observacoes: string[] }`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return { status: 'INDETERMINADO', confidence: 0 };

      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '')) as AiCheckResponse;
      return {
        status: parsed.status ?? 'INDETERMINADO',
        confidence: parsed.confidence ?? 0,
        details: parsed.details,
      };
    } catch (e) {
      return {
        status: 'INDETERMINADO',
        confidence: 0,
        details: { observacoes: [`Erro Gemini: ${(e as Error).message}`] },
      };
    }
  }

  private async fetchImageAsBase64(url: string): Promise<string> {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timeout);
    const buf = await res.arrayBuffer();
    return Buffer.from(buf).toString('base64');
  }

  /** Retorna último resultado de IA para uma foto */
  async getLastResult(taskPhotoId: string): Promise<AiCheckResult | null> {
    return this.aiCheckRepo.findOne({
      where: { taskPhotoId },
      order: { createdAt: 'DESC' },
    });
  }
}
