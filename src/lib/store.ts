import fs from 'node:fs';
import path from 'node:path';
import { PresetItem, HistoryItem, ProxySettings } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface AppData {
  presets: PresetItem[];
  history: HistoryItem[];
  settings: ProxySettings;
}

const DEFAULT_PRESETS: PresetItem[] = [
  {
    id: 'yt-1',
    title: '🎧 Lofi Girl',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    type: 'youtube',
    description: 'Relaxing beats to code/study to'
  },
  {
    id: 'yt-2',
    title: '🌿 Relaxing 4K Nature',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    type: 'youtube',
    description: 'Scenic Swiss Alps 4K footage'
  },
  {
    id: 'yt-3',
    title: '⚡ Synthwave Coding',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    type: 'youtube',
    description: 'High tempo cyberpunk focus music'
  },
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
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading store.json:', e);
  }

  return {
    presets: DEFAULT_PRESETS,
    history: [],
    settings: DEFAULT_SETTINGS
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
export function getHistory(limit = 10): HistoryItem[] {
  const data = readData();
  return data.history.slice(0, limit);
}

export function addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem {
  const data = readData();
  const newHistory: HistoryItem = {
    ...item,
    id: `hist-${Date.now()}`,
    timestamp: Date.now()
  };

  // Avoid duplicates at top
  data.history = data.history.filter(h => h.url !== item.url);
  data.history.unshift(newHistory);

  // Keep last 50 items
  if (data.history.length > 50) {
    data.history = data.history.slice(0, 50);
  }

  writeData(data);
  return newHistory;
}

export function clearHistory(): void {
  const data = readData();
  data.history = [];
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

