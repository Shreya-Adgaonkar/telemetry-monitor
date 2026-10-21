import { HistoryPoint, ParameterData, DashboardResponse } from './types.js';

interface ParameterConfig {
  baseline: number;
  unit: string;
  decimals: number;
}

export class TelemetrySimulator {
  private configs: Record<'velocity' | 'pressure' | 'temperature', ParameterConfig> = {
    velocity: { baseline: 185.4, unit: 'cm/s', decimals: 1 },
    pressure: { baseline: 1012, unit: 'mbar', decimals: 0 },
    temperature: { baseline: 36.8, unit: '°C', decimals: 1 },
  };

  private currentValues: Record<string, number>;
  private historyData: Record<string, HistoryPoint[]>;
  private cycle: number = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.currentValues = {
      velocity: this.configs.velocity.baseline,
      pressure: this.configs.pressure.baseline,
      temperature: this.configs.temperature.baseline,
    };

    this.historyData = {
      velocity: [],
      pressure: [],
      temperature: [],
    };
  }

  public tick(): void {
    this.cycle += 1;
    const position = this.cycle % 10;
    // Positions 1-5 = drift. Positions 6, 7, 8, 9, 0 = recovery.
    const isDrift = position >= 1 && position <= 5;

    const keys = Object.keys(this.configs) as Array<keyof typeof this.configs>;
    
    // Generate the exact ISO-based UTC HH:mm:ss format
    const now = new Date();
    const timeStr = now.toISOString().substring(11, 19);

    for (const key of keys) {
      const config = this.configs[key];
      let val = this.currentValues[key];

      if (isDrift) {
        // Drift Phase: random value between -0.10 and +0.10 multiplied by baseline
        const randomFactor = Math.random() * 0.20 - 0.10;
        val += randomFactor * config.baseline;

        // Clamp inside baseline ±25% bounds
        const minLimit = config.baseline * 0.75;
        const maxLimit = config.baseline * 1.25;
        val = Math.max(minLimit, Math.min(maxLimit, val));
      } else {
        // Recovery Phase: close 40% of the gap back to baseline
        val += (config.baseline - val) * 0.4;
      }

      // Round to configured decimal precision
      const roundedVal = Number(val.toFixed(config.decimals));
      this.currentValues[key] = roundedVal;

      // Update parameter history registry
      const history = this.historyData[key];
      history.push({ time: timeStr, value: roundedVal });
      if (history.length > 100) {
        history.shift();
      }
    }
  }

  public getSnapshot(): DashboardResponse {
    return {
      timestamp: new Date().toISOString(),
      velocity: {
        value: this.currentValues.velocity,
        unit: this.configs.velocity.unit,
        history: [...this.historyData.velocity]
      },
      pressure: {
        value: this.currentValues.pressure,
        unit: this.configs.pressure.unit,
        history: [...this.historyData.pressure]
      },
      temperature: {
        value: this.currentValues.temperature,
        unit: this.configs.temperature.unit,
        history: [...this.historyData.temperature]
      }
    };
  }

  public start(): void {
    // Fire once immediately, then start loop
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
