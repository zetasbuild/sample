export interface PresetItem {
  id: string;
  title: string;
  url: string;
  type: 'youtube' | 'website';
  description?: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  type: 'youtube' | 'website';
  title?: string;
  timestamp: number;
}

export interface AdminUser {
  username: string;
  role: 'admin';
}

export interface ProxySettings {
  enabled: boolean;
  userAgent: string;
}

export interface AdminCredentials {
  username: string;
  passwordHash?: string; // or plain for simple local setup
  passwordPlain: string;
  updatedAt?: number;
}
