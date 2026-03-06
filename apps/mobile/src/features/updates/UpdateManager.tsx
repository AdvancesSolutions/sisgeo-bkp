/**
 * Gerencia atualizações OTA: verifica ao abrir, mostra modal "Atualização pronta"
 * ou tela bloqueante "Atualize na loja" conforme a política do servidor.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useUpdateManager } from '../../hooks/useUpdateManager';

export function UpdateManager({ children }: { children: React.ReactNode }) {
  const { state, applyUpdate, dismissUpdateReady } = useUpdateManager();

  // Tela bloqueante: atualização obrigatória na loja
  if (state.storeUpdateRequired) {
    return (
      <View style={styles.blockingContainer}>
        <Text style={styles.blockingTitle}>Atualização obrigatória</Text>
        <Text style={styles.blockingMessage}>{state.storeUpdateMessage}</Text>
        <Text style={styles.blockingHint}>
          Acesse a loja de aplicativos e atualize o SIGEO para continuar.
        </Text>
      </View>
    );
  }

  return (
    <>
      {children}

      {/* Modal: Atualização pronta — Reiniciar agora */}
      <Modal
        visible={state.updateReady}
        transparent
        animationType="fade"
        onRequestClose={dismissUpdateReady}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atualização pronta</Text>
            <Text style={styles.modalMessage}>
              Uma nova versão foi baixada. Reinicie agora para aplicar.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={dismissUpdateReady}
                disabled={state.applying}
              >
                <Text style={styles.buttonSecondaryText}>Depois</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={applyUpdate}
                disabled={state.applying}
              >
                {state.applying ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonPrimaryText}>Reiniciar agora</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  blockingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  blockingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  blockingMessage: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  blockingHint: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonSecondary: {
    backgroundColor: '#334155',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#94a3b8',
  },
});
