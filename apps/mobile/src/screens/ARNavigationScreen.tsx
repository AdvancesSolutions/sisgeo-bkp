/**
 * ARNavigationScreen - Tela de navegação AR (Wayfinding)
 *
 * Ativação sob demanda: só abre quando o usuário clica em "Como chegar" ou "Localizar Ponto".
 * Economiza bateria ao não manter câmera/GPS ativos em segundo plano.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { ARNavigation } from '../components/ar/ARNavigation';
import type { RootStackParamList } from '../app/types';

type Route = RouteProp<RootStackParamList, 'ARNavigation'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'ARNavigation'>;

export function ARNavigationScreen({ route, navigation }: { route: Route; navigation: Nav }) {
  const { targetLat, targetLng, targetName } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  const hasValidTarget =
    targetLat != null &&
    targetLng != null &&
    !isNaN(targetLat) &&
    !isNaN(targetLng);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (mounted) setLocationPermission(status === 'granted');
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Permissão da câmera necessária para navegação AR.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Permitir câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!locationPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Permissão de localização necessária para direcionar.
        </Text>
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasValidTarget) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Destino inválido. Coordenadas não disponíveis.
        </Text>
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ARNavigation
      targetLat={targetLat}
      targetLng={targetLng}
      targetName={targetName ?? 'Próximo setor'}
      onClose={() => navigation.goBack()}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  message: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
