import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  TaskDetail: { taskId: string };
  TaskExecution: { taskId: string };
  TakeTaskPhoto: { taskId: string; type: 'BEFORE' | 'AFTER' };
  ARNavigation: { targetLat: number; targetLng: number; targetName?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Ponto: undefined;
  Photo: undefined;
};
