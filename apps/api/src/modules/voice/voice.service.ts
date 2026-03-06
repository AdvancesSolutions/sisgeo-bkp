import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const OLLAMA_PROMPT = `Analise a frase do colaborador e retorne APENAS um JSON válido, sem markdown.
Identifique a intenção e parâmetros.

Intenções possíveis:
- REPORT_INCIDENT: relatar ocorrência (falta material, equipamento quebrado, etc.)
- CHECK_ITEM: marcar item do checklist como concluído
- CHECK_ALL: marcar todos os itens como concluídos
- OPEN_CAMERA: abrir câmera para foto
- TRAINING_HELP: pedir ajuda/tutorial (ex: "como limpar vidro")
- UNKNOWN: não reconhecido

Para REPORT_INCIDENT, inclua type: FALTA_MATERIAL | QUEBRA_EQUIPAMENTO | OUTRO e description (resumo).
Para CHECK_ITEM, inclua itemLabel (texto que identifica o item, ex: "bancada", "piso").
Para TRAINING_HELP, inclua topic (assunto, ex: "vidro", "piso").

Frase: "{{TEXT}}"

Responda APENAS com JSON: { "intent": string, "type"?: string, "description"?: string, "itemLabel"?: string, "topic"?: string }`;

export interface VoiceIntent {
  intent: 'REPORT_INCIDENT' | 'CHECK_ITEM' | 'CHECK_ALL' | 'OPEN_CAMERA' | 'TRAINING_HELP' | 'UNKNOWN';
  type?: string;
  description?: string;
  itemLabel?: string;
  topic?: string;
}

@Injectable()
export class VoiceService {
  constructor(private readonly config: ConfigService) {}

  private getOllamaUrl(): string {
    return this.config.get<string>('OLLAMA_URL') ?? 'http://localhost:11434';
  }

  async parseIntent(text: string, _context?: { checklistLabels?: string[] }): Promise<VoiceIntent> {
    const ollamaUrl = this.getOllamaUrl();
    const prompt = OLLAMA_PROMPT.replace('{{TEXT}}', text);

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10000);

    try {
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt,
          stream: false,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return this.fallbackParse(text);
      }

      const data = (await res.json()) as { response?: string };
      const parsed = this.extractJson(data.response ?? '');
      if (parsed) return parsed;
    } catch {
      clearTimeout(timeout);
    }
    return this.fallbackParse(text);
  }

  private extractJson(text: string): VoiceIntent | null {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const obj = JSON.parse(match[0]) as Partial<VoiceIntent>;
      const intent = obj.intent ?? 'UNKNOWN';
      if (!['REPORT_INCIDENT', 'CHECK_ITEM', 'CHECK_ALL', 'OPEN_CAMERA', 'TRAINING_HELP', 'UNKNOWN'].includes(intent)) {
        return { ...obj, intent: 'UNKNOWN' } as VoiceIntent;
      }
      return { ...obj, intent } as VoiceIntent;
    } catch {
      return null;
    }
  }

  private fallbackParse(text: string): VoiceIntent {
    const t = text.toLowerCase().trim();
    if (/\b(reportar|ocorrência|falta|acabou|detergente|lâmpada|quebrad)\w*\b/.test(t)) {
      let type = 'OUTRO';
      if (/\b(falta|acabou|detergente|material)\b/.test(t)) type = 'FALTA_MATERIAL';
      else if (/\b(lâmpada|quebrad|equipamento)\b/.test(t)) type = 'QUEBRA_EQUIPAMENTO';
      return { intent: 'REPORT_INCIDENT', type, description: text.slice(0, 200) };
    }
    if (/\b(abrir câmera|câmera|tirar foto)\b/.test(t)) return { intent: 'OPEN_CAMERA' };
    if (/\b(marcar todos|todos feitos|concluído tudo)\b/.test(t)) return { intent: 'CHECK_ALL' };
    if (/\b(como limpar|como faço|ajuda|tutorial)\b/.test(t)) {
      const topic = t.replace(/.*(vidro|piso|bancada|limpeza)\w*.*/, '$1') || 'limpeza';
      return { intent: 'TRAINING_HELP', topic };
    }
    if (/\b(concluíd[oa]|feito|limpo|confirmar)\b/.test(t)) {
      const m = t.match(/(?:limpeza|limpar)\s+(?:da?\s+)?(\w+)/);
      return { intent: 'CHECK_ITEM', itemLabel: m?.[1] ?? 'item' };
    }
    return { intent: 'UNKNOWN' };
  }
}
