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
