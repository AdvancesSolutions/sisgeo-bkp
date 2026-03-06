import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_queue';

export type PendingActionType = 'checkin' | 'checkout' | 'updateTask';

export interface PendingAction {
  id: string;
  type: PendingActionType;
  payload: unknown;
  createdAt: string;
}

export async function getPendingActions(): Promise<PendingAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addPendingAction(
  type: PendingActionType,
  payload: unknown
): Promise<PendingAction> {
  const actions = await getPendingActions();
  const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const action: PendingAction = { id, type, payload, createdAt: new Date().toISOString() };
  actions.push(action);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(actions));
  return action;
}

export async function removePendingAction(id: string): Promise<void> {
  const actions = await getPendingActions();
  const next = actions.filter((a) => a.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
}

export async function clearPendingActions(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export function isNetworkError(e: unknown): boolean {
  if (e && typeof e === 'object' && 'code' in e) {
    const code = (e as { code?: string }).code;
    if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || code === 'ETIMEDOUT') return true;
  }
  if (e && typeof e === 'object' && 'message' in e) {
    const msg = String((e as { message: unknown }).message);
    if (msg.includes('Network Error') || msg.includes('network')) return true;
  }
  if (e && typeof e === 'object' && 'response' in e) {
    const res = (e as { response?: unknown }).response;
    if (res === undefined) return true;
  }
  return false;
}
