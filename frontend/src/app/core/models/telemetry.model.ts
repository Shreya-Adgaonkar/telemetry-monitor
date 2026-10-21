export interface HistoryPoint {
  time: string;
  value: number;
}

export interface ParameterData {
  value: number;
  unit: string;
  history: HistoryPoint[];
}

export interface DashboardResponse {
  timestamp: string;
  velocity: ParameterData;
  pressure: ParameterData;
  temperature: ParameterData;
}

export type ParameterKey = 'velocity' | 'pressure' | 'temperature';

export const PARAMETER_KEYS: ParameterKey[] = ['velocity', 'pressure', 'temperature'];

export interface SessionRow {
  timestamp: string;
  velocity: number;
  pressure: number;
  temperature: number;
}