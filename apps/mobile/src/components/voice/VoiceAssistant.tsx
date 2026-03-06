/**
 * VoiceAssistant - Botão flutuante de microfone para comandos de voz
 *
 * STT: expo-speech-recognition (API nativa)
 * TTS: expo-speech
 * Intent: API /voice/intent (Ollama)
 *
 * Microfone ativo apenas quando o app está em primeiro plano.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Mic } from 'lucide-react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import {
  parseIntentFromText,
  executeIntent,
  speak,
  stopSpeaking,
  type VoiceAssistantCallbacks,
} from '../../services/voiceAssistantService';

const LANG = 'pt-BR';

export interface VoiceAssistantProps {
  /** Habilitado apenas quando true (ex: na tela de execução de tarefa) */
  enabled: boolean;
  /** Labels dos itens do checklist para melhor matching */
  checklistLabels?: string[];
  /** Callbacks para executar as ações */
  callbacks: VoiceAssistantCallbacks;
  /** Estilo do container (posição do FAB) */
  style?: object;
}

export function VoiceAssistant({
  enabled,
  checklistLabels = [],
  callbacks,
  style,
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const processingRef = useRef(false);

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('result', async (event: { results?: { transcript?: string }[]; isFinal?: boolean }) => {
    const transcript = event.results?.[0]?.transcript?.trim();
    if (!transcript || processingRef.current) return;
    if (!event.isFinal) return;

    processingRef.current = true;
    setIsProcessing(true);
    stopSpeaking();

    try {
      const intent = await parseIntentFromText(transcript, checklistLabels);
      const message = await executeIntent(intent, callbacks);
      await speak(message, { language: LANG });
    } catch {
      await speak('Não consegui processar. Tente novamente.', { language: LANG });
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  });

  useSpeechRecognitionEvent('error', (event: { error?: string }) => {
    setIsListening(false);
    setIsProcessing(false);
    processingRef.current = false;
    if (event.error !== 'aborted' && event.error !== 'no-speech') {
      speak('Erro no reconhecimento de voz. Tente novamente.', { language: LANG });
    }
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      appState.current = next;
      if (next !== 'active' && isListening) {
        try {
          ExpoSpeechRecognitionModule.stop();
        } catch {
          // ignore
        }
        setIsListening(false);
      }
    });
    return () => sub.remove();
  }, [isListening]);

  const handlePress = useCallback(async () => {
    if (!enabled || isProcessing) return;
    if (appState.current !== 'active') return;

    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      speak('Permissão de microfone negada.', { language: LANG });
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: LANG,
      interimResults: true,
      continuous: false,
      ...(Platform.OS === 'ios' && {
        iosVoiceProcessingEnabled: true,
      }),
    });
  }, [enabled, isListening, isProcessing]);

  if (!enabled) return null;

  return (
    <View style={[styles.fabContainer, style]}>
      <TouchableOpacity
        style={[
          styles.fab,
          isListening && styles.fabListening,
          isProcessing && styles.fabProcessing,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={isProcessing}
        accessibilityLabel="Microfone para comandos de voz"
        accessibilityHint="Toque para falar um comando"
      >
        <Mic
          size={28}
          color="#fff"
          strokeWidth={isListening ? 2.5 : 2}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabListening: {
    backgroundColor: '#ef4444',
  },
  fabProcessing: {
    backgroundColor: '#64748b',
    opacity: 0.9,
  },
});
