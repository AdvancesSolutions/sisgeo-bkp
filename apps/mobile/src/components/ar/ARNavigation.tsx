/**
 * ARNavigation - Componente de navegação visual (Wayfinding)
 *
 * Exibe setas direcionais sobre a câmera apontando para o destino.
 * Ícones semi-transparentes para não obstruir a visão do ambiente.
 * Ativação sob demanda para economizar bateria.
 *
 * Requer: expo-camera, expo-location, expo-sensors (Magnetometer)
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { X, Navigation } from 'lucide-react-native';

/** Calcula bearing (ângulo em graus 0-360) de A para B */
function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  let br = (Math.atan2(y, x) * 180) / Math.PI;
  return (br + 360) % 360;
}

/** Distância em km (Haversine) */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Converte magnetômetro (x,y) em heading 0-360 (phone flat, portrait) */
function magnetToHeading(x: number, y: number): number {
  let h = (Math.atan2(y, x) * 180) / Math.PI;
  if (h < 0) h += 360;
  return h;
}

export interface ARNavigationProps {
  targetLat: number;
  targetLng: number;
  targetName?: string;
  onClose: () => void;
}

export function ARNavigation({
  targetLat,
  targetLng,
  targetName = 'Próximo setor',
  onClose,
}: ARNavigationProps) {
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  const updateLocation = useCallback(async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLat(loc.coords.latitude);
      setUserLng(loc.coords.longitude);
      setError(null);
    } catch {
      setError('Não foi possível obter sua localização.');
    }
  }, []);

  useEffect(() => {
    updateLocation();
    Magnetometer.setUpdateInterval(100);
    const sub = Magnetometer.addListener((data) => {
      setHeading(magnetToHeading(data.x, data.y));
    });
    subscriptionRef.current = sub;
    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [updateLocation]);

  useEffect(() => {
    const id = setInterval(updateLocation, 3000);
    return () => clearInterval(id);
  }, [updateLocation]);

  const bearing =
    userLat != null && userLng != null
      ? bearingDeg(userLat, userLng, targetLat, targetLng)
      : 0;
  const distanceKm =
    userLat != null && userLng != null
      ? haversineKm(userLat, userLng, targetLat, targetLng)
      : 0;
  const arrowRotation = bearing - heading;

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} />

      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <X size={24} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Overlay com seta semi-transparente - não obstrui a visão */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View
          style={[
            styles.arrowContainer,
            { transform: [{ rotate: `${arrowRotation}deg` }] },
          ]}
        >
          <View style={styles.arrowGlow} />
          <View style={styles.arrowInner}>
            <Navigation
              size={56}
              color="rgba(14,165,233,0.9)"
              strokeWidth={2}
              style={styles.arrow}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.card}>
          <Text style={styles.targetName} numberOfLines={1}>
            {targetName}
          </Text>
          <Text style={styles.distance}>
            {distanceKm < 0.02
              ? 'Você está no local'
              : distanceKm < 0.08
                ? 'Muito próximo'
                : `${(distanceKm * 1000).toFixed(0)} m`}
          </Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(14,165,233,0.15)',
  },
  arrowInner: {
    zIndex: 1,
  },
  arrow: {
    opacity: 0.95,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  card: {
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  targetName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  distance: {
    color: '#0ea5e9',
    fontSize: 14,
    marginTop: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
  },
});
