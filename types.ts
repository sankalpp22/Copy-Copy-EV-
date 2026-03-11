
export enum AppStep {
  AUTH = 'AUTH',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  DASHBOARD = 'DASHBOARD'
}

export enum NavSection {
  HOME = 'HOME',
  EXPLORE = 'EXPLORE',
  PROFILE = 'PROFILE'
}

export interface User {
  uid: string;
  name: string;
  email: string;
  mobile: string;
  countryCode: string;
  photoUrl: string;
  emergencyContact?: string;
  vehicle?: Vehicle;
}

export enum VehicleCategory {
  FOUR_WHEELER = '4 Wheeler',
  TWO_WHEELER = '2 Wheeler',
  THREE_WHEELER = '3 Wheeler'
}

export interface Vehicle {
  category: VehicleCategory;
  make: string;
  model: string;
  year: string;
  currentRange: number;
  homeChargerRating: number; // in kWh
  chargerType: string;
  batteryCapacity?: number; // kWh
  efficiency?: number; // Wh/km
  usableSOCMin?: number; // %
  usableSOCMax?: number; // %
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  range: number; // km
  time: string; // duration
}

export interface FileMetadata {
  id: string;
  fileName: string;
  downloadURL: string;
  fileType: string;
  createdAt: number;
}

export interface AppState {
  step: AppStep;
  user: User | null;
  vehicle: Vehicle | null;
  currentSection: NavSection;
  dailyStats: DailyStats;
}
