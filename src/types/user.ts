export interface UserPreferences {
  bedTime?: string;
  wakeTime?: string;
  chronotype?: 'early' | 'normal' | 'late';
  lightSensitivity?: 'low' | 'normal' | 'high';
  caffeineMetabolism?: 'slow' | 'normal' | 'fast';
}

export interface UserProfile {
  id: string;
  email: string;
  preferences?: UserPreferences;
  timezone?: string;
  notificationsEnabled?: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
} 