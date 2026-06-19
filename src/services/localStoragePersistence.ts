import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const BACKUP_FILE = 'localstorage_backup.json';
const IDB_DB_NAME = 'TodoTxtBackupDB';
const IDB_STORE_NAME = 'keyval';

// Save helper with debouncing
let saveTimeout: any = null;

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      e.target.result.createObjectStore(IDB_STORE_NAME);
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = () => reject(request.error);
  });
};

const saveToIDB = async (data: string) => {
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const request = store.put(data, 'backup');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IDB save failed:', e);
  }
};

const loadFromIDB = async (): Promise<string | null> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const request = store.get('backup');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IDB load failed:', e);
    return null;
  }
};

const saveToDisk = async () => {
  try {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    
    const jsonStr = JSON.stringify(data);

    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: BACKUP_FILE,
        data: jsonStr,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
    } else {
      await saveToIDB(jsonStr);
    }
  } catch (error) {
    console.error('Failed to save localStorage backup:', error);
  }
};

const queueSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToDisk, 500);
};

export const restoreLocalStorageBackup = async (): Promise<void> => {
  try {
    let jsonStr: string | null = null;
    
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.readFile({
          path: BACKUP_FILE,
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
        jsonStr = result.data as string;
      } catch (e) {
        console.log('No native backup found to restore');
      }
    } else {
      jsonStr = await loadFromIDB();
    }
    
    if (jsonStr) {
      const data = JSON.parse(jsonStr);
      Object.keys(data).forEach((key) => {
        localStorage.setItem(key, data[key]);
      });
      console.log('Restored localStorage from backup successfully');
    }
  } catch (error) {
    console.log('No localStorage backup found or read failed');
  }
};

export const initLocalStorageBackup = () => {
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
