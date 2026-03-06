/**
 * VisionAIService - Auditoria automática de fotos via Ollama (LLaVA)
 *
 * Analisa imagens de limpeza e detecta não conformidades.
 * Integração com Ollama API local (http://localhost:11434).
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const OLLAMA_PROMPT = `Analise esta foto de uma tarefa de limpeza. Identifique:
1. O ambiente está limpo?
2. Existem resíduos, manchas ou lixo visível?
3. Há objetos fora do lugar?

Responda APENAS em JSON válido, sem markdown, com os campos:
{ "limpo": boolean, "confianca": número de 0 a 100, "detalhes": "string descritiva", "anomalia_detectada": boolean }`;

export interface OllamaVisionResult {
  limpo: boolean;
  confianca: number;
  detalhes: string;
  anomalia_detectada: boolean;
}

export interface VisionAnalysisResult {
  limpo: boolean;
  confianca: number;
  detalhes: string;
  anomaliaDetectada: boolean;
  status: 'OK' | 'SUSPEITA' | 'AGUARDANDO_REVISAO_MANUAL';
  rawResponse?: Record<string, unknown>;
}

@Injectable()
export class VisionAIService {
  constructor(private readonly config: ConfigService) {}

  private getOllamaUrl(): string {
    return this.config.get<string>('OLLAMA_URL') ?? 'http://localhost:11434';
  }

  /**
   * Converte URL da imagem em Base64
   */
  async fetchImageAsBase64(imageUrl: string): Promise<string> {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(imageUrl, { signal: ctrl.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      return Buffer.from(buf).toString('base64');
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  }

  /**
   * Envia imagem para Ollama (LLaVA) e retorna análise
   */
  async analyzeWithOllama(imageUrl: string): Promise<VisionAnalysisResult> {
    const base64 = await this.fetchImageAsBase64(imageUrl);
    const ollamaUrl = this.getOllamaUrl();

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 60000);

    try {
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llava',
          prompt: OLLAMA_PROMPT,
          images: [base64],
          stream: false,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status}`);
      }

      const data = (await res.json()) as { response?: string };
      const text = data.response ?? '';
      const parsed = this.parseOllamaResponse(text);

      const status =
        !parsed.limpo && parsed.confianca >= 80
          ? 'SUSPEITA'
          : parsed.limpo
            ? 'OK'
            : 'AGUARDANDO_REVISAO_MANUAL';

      return {
        limpo: parsed.limpo,
        confianca: parsed.confianca,
        detalhes: parsed.detalhes ?? '',
        anomaliaDetectada: parsed.anomalia_detectada ?? !parsed.limpo,
        status,
        rawResponse: parsed as unknown as Record<string, unknown>,
      };
    } catch (e) {
      clearTimeout(timeout);
      throw e; // Propaga para BullMQ retentar (3x com backoff)
    }
  }

  private parseOllamaResponse(text: string): OllamaVisionResult {
    const cleaned = text
      .replace(/```json\n?|\n?```/g, '')
      .replace(/\n/g, ' ')
      .trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return {
        limpo: true,
        confianca: 0,
        detalhes: 'Resposta não parseável',
        anomalia_detectada: false,
      };
    }
    try {
      const parsed = JSON.parse(match[0]) as Partial<OllamaVisionResult>;
      return {
        limpo: parsed.limpo ?? true,
        confianca: Math.min(100, Math.max(0, Number(parsed.confianca) ?? 0)),
        detalhes: String(parsed.detalhes ?? ''),
        anomalia_detectada: parsed.anomalia_detectada ?? false,
      };
    } catch {
      return {
        limpo: true,
        confianca: 0,
        detalhes: 'JSON inválido',
        anomalia_detectada: false,
      };
    }
  }

  /** Verifica se Ollama está disponível */
  async isOllamaAvailable(): Promise<boolean> {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3000);
    try {
      const res = await fetch(`${this.getOllamaUrl()}/api/tags`, {
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      clearTimeout(timeout);
      return false;
    }
  }
}
