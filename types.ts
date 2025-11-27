export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ReminderData {
  text: string;
  audioBuffer: AudioBuffer | null;
}

export interface SafetyImageResponse {
  imageUrl: string | null;
  description: string;
}
