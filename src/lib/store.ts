import fs from 'node:fs';
import path from 'node:path';
import { PresetItem, HistoryItem, ProxySettings, AdminCredentials } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface AppData {
  activeVideoUrl?: string;
  presets: PresetItem[];
  history: HistoryItem[];
  settings: ProxySettings;
  adminCredentials?: AdminCredentials;
}

const DEFAULT_VIDEO_URL = 'https://youtu.be/TtJILk3vXnc';

const DEFAULT_CREDENTIALS: AdminCredentials = {
  username: process.env.ADMIN_USERNAME || 'admin',
  passwordPlain: process.env.ADMIN_PASSWORD || 'admin123',
  updatedAt: Date.now()
};

const DEFAULT_PRESETS: PresetItem[] = [
  {
    id: 'web-1',
    title: '📖 Wikipedia',
    url: 'https://en.wikipedia.org',
    type: 'website',
    description: 'The Free Encyclopedia'
  },
  {
    id: 'web-2',
    title: '📰 Hacker News',
    url: 'https://news.ycombinator.com',
    type: 'website',
    description: 'Tech & startup discussions'
  },
  {
    id: 'web-3',
    title: '🗺️ OpenStreetMap',
    url: 'https://www.openstreetmap.org',
    type: 'website',
    description: 'Free editable map of the world'
  },
  {
    id: 'web-4',
    title: '📄 Example Domain',
    url: 'https://example.com',
    type: 'website',
    description: 'Standard RFC documentation example'
  }
];

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
        presets: parsed.presets || DEFAULT_PRESETS,
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
    presets: DEFAULT_PRESETS,
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

// Preset operations
export function getPresets(type?: 'youtube' | 'website'): PresetItem[] {
  const data = readData();
  if (type) {
    return data.presets.filter(p => p.type === type);
  }
  return data.presets;
}

export function addPreset(preset: Omit<PresetItem, 'id'>): PresetItem {
  const data = readData();
  const newItem: PresetItem = {
    ...preset,
    id: `preset-${Date.now()}`
  };
  data.presets.unshift(newItem);
  writeData(data);
  return newItem;
}

export function deletePreset(id: string): boolean {
  const data = readData();
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
  let list = data.history;
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
  if (type) {
    data.history = data.history.filter(h => h.type !== type);
  } else {
    data.history = [];
  }
  writeData(data);
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
