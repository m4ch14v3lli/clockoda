export type SyncStatus = 'synced' | 'pending' | 'offline';

export type TestType = 'Malaria' | 'Blood Glucose' | 'Typhoid' | 'HIV';

export interface Patient {
  id: string;
  name: string;
  age: string;
  phone: string;
  consent: boolean;
}

export interface TestRecord {
  id: string;
  patientId: string;
  patientName: string;
  testType: TestType;
  timestamp: number;
  status: 'Positive' | 'Negative';
  synced: boolean;
}

export type AppState = 'dashboard' | 'patient-entry' | 'diagnostic-hub' | 'analysis' | 'result';
