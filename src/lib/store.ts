import fs from 'node:fs';
import path from 'node:path';
import { PresetItem, HistoryItem, ProxySettings, AdminCredentials } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface AppData {
  activeVideoUrl?: string;
  activeWebsiteUrl?: string;
  presets?: PresetItem[];
  history?: HistoryItem[];
  settings: ProxySettings;
  adminCredentials?: AdminCredentials;
}

const DEFAULT_VIDEO_URL = 'https://youtu.be/vUjkbW6qM6A';
const DEFAULT_WEBSITE_URL = '';

const DEFAULT_CREDENTIALS: AdminCredentials = {
  username: process.env.ADMIN_USERNAME || 'admin',
  passwordPlain: process.env.ADMIN_PASSWORD || 'admin123',
  updatedAt: Date.now()
};

const DEFAULT_SETTINGS: ProxySettings = {
  enabled: true,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

function readData(): AppData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        activeVideoUrl: parsed.activeVideoUrl || DEFAULT_VIDEO_URL,
        activeWebsiteUrl: parsed.activeWebsiteUrl || DEFAULT_WEBSITE_URL,
        presets: parsed.presets || [],
        history: parsed.history || [],
        settings: parsed.settings || DEFAULT_SETTINGS,
        adminCredentials: parsed.adminCredentials || DEFAULT_CREDENTIALS
      };
    }
  } catch (e) {
    console.error('Error reading store.json:', e);
  }

  return {
    activeVideoUrl: DEFAULT_VIDEO_URL,
    activeWebsiteUrl: DEFAULT_WEBSITE_URL,
    presets: [],
    history: [],
    settings: DEFAULT_SETTINGS,
    adminCredentials: DEFAULT_CREDENTIALS
  };
}

function writeData(data: AppData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing store.json:', e);
  }
}

// Active Video Operations
export function getActiveVideoUrl(): string {
  const data = readData();
  return data.activeVideoUrl || DEFAULT_VIDEO_URL;
}

export function setActiveVideoUrl(url: string): string {
  const data = readData();
  data.activeVideoUrl = url.trim();
  writeData(data);
  return data.activeVideoUrl;
}

// Active Website Operations
export function getActiveWebsiteUrl(): string {
  const data = readData();
  return data.activeWebsiteUrl || DEFAULT_WEBSITE_URL;
}

export function setActiveWebsiteUrl(url: string): string {
  const data = readData();
  let normalized = url.trim();
  if (normalized && !normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  data.activeWebsiteUrl = normalized;
  writeData(data);
  return data.activeWebsiteUrl;
}

// Presets compatibility operations
export function getPresets(type?: 'youtube' | 'website'): PresetItem[] {
  const data = readData();
  const list = data.presets || [];
  if (type) {
    return list.filter(p => p.type === type);
  }
  return list;
}

export function addPreset(preset: Omit<PresetItem, 'id'>): PresetItem {
  const data = readData();
  const newItem: PresetItem = {
    ...preset,
    id: `preset-${Date.now()}`
  };
  data.presets = data.presets || [];
  data.presets.unshift(newItem);
  writeData(data);
  return newItem;
}

export function deletePreset(id: string): boolean {
  const data = readData();
  if (!data.presets) return false;
  const initialLen = data.presets.length;
  data.presets = data.presets.filter(p => p.id !== id);
  if (data.presets.length !== initialLen) {
    writeData(data);
    return true;
  }
  return false;
}

// History operations
export function getHistory(limit = 20, type?: 'youtube' | 'website'): HistoryItem[] {
  const data = readData();
  let list = data.history || [];
  if (type) {
    list = list.filter(h => h.type === type);
  }
  return list.slice(0, limit);
}

export function addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
  const data = readData();
  const newHistory: HistoryItem = {
    ...item,
    id: `hist-${Date.now()}`,
    timestamp: Date.now()
  };

  data.history = data.history || [];
  data.history = data.history.filter(h => h.url !== item.url);
  data.history.unshift(newHistory);

  if (data.history.length > 100) {
    data.history = data.history.slice(0, 100);
  }

  writeData(data);
  return newHistory;
}

export function clearHistory(type?: 'youtube' | 'website'): void {
  const data = readData();
  if (!data.history) return;
  if (type) {
    data.history = data.history.filter(h => h.type !== type);
  } else {
    data.history = [];
  }
  writeData(data);
}

// Admin Credentials Operations
export function getAdminCredentials(): AdminCredentials {
  const data = readData();
  return data.adminCredentials || DEFAULT_CREDENTIALS;
}

export function updateAdminCredentials(username: string, passwordPlain: string): AdminCredentials {
  const data = readData();
  const updated: AdminCredentials = {
    username: username.trim(),
    passwordPlain: passwordPlain.trim(),
    updatedAt: Date.now()
  };
  data.adminCredentials = updated;
  writeData(data);
  return updated;
}

// Settings operations
export function getSettings(): ProxySettings {
  const data = readData();
  return data.settings || DEFAULT_SETTINGS;
}

export function updateSettings(settings: Partial<ProxySettings>): ProxySettings {
  const data = readData();
  data.settings = { ...data.settings, ...settings };
  writeData(data);
  return data.settings;
}
