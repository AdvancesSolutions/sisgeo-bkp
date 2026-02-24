/**
 * VoiceAssistantService - Assistente de voz para checklist e ocorrências
 *
 * STT: expo-speech-recognition (API nativa)
 * TTS: expo-speech
 * Intent: API backend /voice/intent (Ollama fallback local)
 */
import * as Speech from 'expo-speech';
import apiClient from './apiClient';

export type VoiceIntent =
  | 'REPORT_INCIDENT'
  | 'CHECK_ITEM'
  | 'CHECK_ALL'
  | 'OPEN_CAMERA'
  | 'TRAINING_HELP'
  | 'UNKNOWN';

export interface ParsedIntent {
  intent: VoiceIntent;
  type?: string;
  description?: string;
  itemLabel?: string;
  topic?: string;
}

export interface VoiceAssistantCallbacks {
  onReportIncident?: (type: string, description: string) => void;
  onCheckItem?: (itemLabel: string) => void;
  onCheckAll?: () => void;
  onOpenCamera?: () => void;
  onTrainingHelp?: (topic: string) => void;
  onIntentParsed?: (intent: ParsedIntent, text: string) => void;
}

let recognitionInstance: { start: () => void; stop: () => void } | null = null;

export function setSpeechRecognition(instance: { start: () => void; stop: () => void } | null) {
  recognitionInstance = instance;
}

export function speak(text: string, options?: { rate?: number; language?: string }) {
  return new Promise<void>((resolve) => {
    Speech.speak(text, {
      language: options?.language ?? 'pt-BR',
      rate: options?.rate ?? 0.9,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export function stopSpeaking() {
  Speech.stop();
}

export async function parseIntentFromText(
  text: string,
  checklistLabels?: string[],
): Promise<ParsedIntent> {
  try {
    const { data } = await apiClient.post<ParsedIntent>('/voice/intent', {
      text,
      checklistLabels,
    });
    return data;
  } catch {
    return { intent: 'UNKNOWN' };
  }
}

export async function executeIntent(
  intent: ParsedIntent,
  callbacks: VoiceAssistantCallbacks,
): Promise<string> {
  const { onReportIncident, onCheckItem, onCheckAll, onOpenCamera, onTrainingHelp } = callbacks;

  switch (intent.intent) {
    case 'REPORT_INCIDENT': {
      const type = intent.type ?? 'OUTRO';
      const description = intent.description ?? 'Ocorrência reportada por voz';
      onReportIncident?.(type, description);
      return `Entendido. Ocorrência de ${type === 'FALTA_MATERIAL' ? 'falta de material' : type === 'QUEBRA_EQUIPAMENTO' ? 'equipamento quebrado' : 'outro tipo'} registrada para este setor.`;
    }
    case 'CHECK_ITEM': {
      const label = intent.itemLabel ?? 'item';
      onCheckItem?.(label);
      return `Item "${label}" marcado como concluído.`;
    }
    case 'CHECK_ALL': {
      onCheckAll?.();
      return 'Todos os itens do checklist foram marcados como concluídos.';
    }
    case 'OPEN_CAMERA': {
      onOpenCamera?.();
      return 'Abrindo câmera.';
    }
    case 'TRAINING_HELP': {
      const topic = intent.topic ?? 'limpeza';
      onTrainingHelp?.(topic);
      return `Abrindo tutorial sobre ${topic}.`;
    }
    default:
      return 'Não entendi. Pode repetir?';
  }
}

export function startListening() {
  recognitionInstance?.start();
}

export function stopListening() {
  recognitionInstance?.stop();
}
