import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../features/auth/AuthContext';
import { useEmployeesList } from '../features/employees/useEmployees';
import { useTimeClockHistory, useCheckIn, useCheckOut } from '../features/timeclock/useTimeclock';
import * as Location from 'expo-location';
import { LogIn, LogOut } from 'lucide-react-native';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

export function PontoScreen() {
  const { user } = useAuth();
  const { data: employeesData } = useEmployeesList(1, 10);
  const employeeId = user?.employeeId ?? employeesData?.data?.[0]?.id ?? null;

  const { data: history, isLoading } = useTimeClockHistory(employeeId, 20);
  const checkIn = useCheckIn(employeeId);
  const checkOut = useCheckOut(employeeId);

  const lastRecord = history?.[0];
  const isCheckedIn = lastRecord?.type === 'CHECKIN' || lastRecord?.type === 'CHECKIN_FORA_DE_AREA';

  const requestLocationAndCheckIn = async () => {
    if (!employeeId) {
      Alert.alert('Aviso', 'Nenhum funcionário vinculado à sua conta. Configure em Acessos dos Funcionários.');
      return;
    }
    try {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        Alert.alert('GPS necessário', 'Permita o acesso à localização para registrar o ponto.');
        return;
      }
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') {
        Alert.alert('Câmera necessária', 'Permita o acesso à câmera para registrar a foto do ponto.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      await checkIn.mutateAsync({
        employeeId,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        photoUri: result.assets[0].uri,
      });
      Alert.alert('Sucesso', 'Check-in registrado com sua localização e foto.');
    } catch (e: unknown) {
      Alert.alert('Erro', getApiErrorMessage(e));
    }
  };

  const requestLocationAndCheckOut = async () => {
    if (!employeeId) {
      Alert.alert('Aviso', 'Nenhum funcionário vinculado.');
      return;
    }
    try {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        Alert.alert('GPS necessário', 'Permita o acesso à localização para registrar o ponto.');
        return;
      }
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') {
        Alert.alert('Câmera necessária', 'Permita o acesso à câmera para registrar a foto do ponto.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      await checkOut.mutateAsync({
        employeeId,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        photoUri: result.assets[0].uri,
      });
      Alert.alert('Sucesso', 'Check-out registrado com sua localização e foto.');
    } catch (e: unknown) {
      Alert.alert('Erro', getApiErrorMessage(e));
    }
  };

  if (!employeeId) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#0ea5e9" />
        <Text style={styles.hint}>Carregando vínculo com funcionário...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Registro de ponto (GPS e foto obrigatórios)</Text>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnCheckIn]}
          onPress={requestLocationAndCheckIn}
          disabled={checkIn.isPending || isCheckedIn}
        >
          {checkIn.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <LogIn size={20} color="#fff" />
              <Text style={styles.btnText}>Check-in</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnCheckOut]}
          onPress={requestLocationAndCheckOut}
          disabled={checkOut.isPending || !isCheckedIn}
        >
          {checkOut.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <LogOut size={20} color="#fff" />
              <Text style={styles.btnText}>Check-out</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Histórico recente</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color="#0ea5e9" style={styles.loader} />
      ) : !history?.length ? (
        <Text style={styles.empty}>Nenhum registro ainda.</Text>
      ) : (
        history.map((r) => (
          <View key={r.id} style={styles.historyRow}>
            <Text style={styles.historyType}>
              {r.type === 'CHECKIN' ? 'Entrada' : r.type === 'CHECKIN_FORA_DE_AREA' ? 'Entrada (fora de área)' : 'Saída'}
            </Text>
            <Text style={styles.historyTime}>
              {new Date(r.createdAt).toLocaleString('pt-BR')}
            </Text>
            {r.lat != null && (
              <Text style={styles.historyCoords}>{r.lat.toFixed(4)}, {r.lng?.toFixed(4)}</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  hint: { color: '#94a3b8', marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginBottom: 12 },
  buttonsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  btn: { flex: 1, flexDirection: 'row', gap: 8, padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnCheckIn: { backgroundColor: '#22c55e' },
  btnCheckOut: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontWeight: '600' },
  loader: { marginVertical: 12 },
  empty: { color: '#64748b' },
  historyRow: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyType: { color: '#f8fafc', fontWeight: '600' },
  historyTime: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  historyCoords: { color: '#64748b', fontSize: 11, marginTop: 2 },
});
