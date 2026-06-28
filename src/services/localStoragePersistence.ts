import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const BACKUP_FILE = 'localstorage_backup.json';

// Save helper with debouncing
let saveTimeout: any = null;

const saveToDisk = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    
    await Filesystem.writeFile({
      path: BACKUP_FILE,
      data: JSON.stringify(data),
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
  } catch (error) {
    console.error('Failed to save localStorage backup to native storage:', error);
  }
};

const queueSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToDisk, 500);
};

export const restoreLocalStorageBackup = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const result = await Filesystem.readFile({
      path: BACKUP_FILE,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
    
    if (result.data) {
      const data = JSON.parse(result.data as string);
      Object.keys(data).forEach((key) => {
        localStorage.setItem(key, data[key]);
      });
      console.log('Restored localStorage from native backup successfully');
    }
  } catch (error) {
    // File might not exist on first start, which is fine
    console.log('No localStorage backup found to restore or read failed');
  }
};

export const initLocalStorageBackup = () => {
  if (!Capacitor.isNativePlatform()) return;

  const originalSetItem = window.localStorage.setItem;
  const originalRemoveItem = window.localStorage.removeItem;
  const originalClear = window.localStorage.clear;

  window.localStorage.setItem = function (key: string, value: string) {
    originalSetItem.apply(this, [key, value]);
    queueSave();
  };

  window.localStorage.removeItem = function (key: string) {
    originalRemoveItem.apply(this, [key]);
    queueSave();
  };

  window.localStorage.clear = function () {
    originalClear.apply(this);
    queueSave();
  };
};
