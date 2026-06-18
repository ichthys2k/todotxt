import type { SyncProvider } from './SyncProvider';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

declare global {
  interface Window {
    electronAPI?: {
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<void>;
      selectFile: (title: string) => Promise<string | null>;
      getPaths: () => Promise<{ todo: string | null; archive: string | null }>;
      setPaths: (todoPath: string | null, archivePath: string | null) => Promise<void>;
      showMainWindow: () => Promise<void>;
      closeWidgetWindow: () => Promise<void>;
      checkForUpdates: () => Promise<void>;
      onUpdaterStatus: (callback: (status: string, info: string) => void) => void;
    };
  }
}


const LOCAL_STORAGE_KEY = 'todo_txt_local_content';
const LOCAL_ARCHIVE_KEY = 'todo_txt_local_archive_content';
const LOCAL_CONFIG_KEY = 'todo_txt_local_config';

// --- FILE SYSTEM ACCESS & INDEXEDDB HELPERS ---

const DB_NAME = 'todo_txt_file_handles';
const STORE_NAME = 'handles';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getStoredHandle = async (key: string): Promise<FileSystemFileHandle | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to get handle from IndexedDB', e);
    return null;
  }
};

export const storeHandle = async (key: string, handle: FileSystemFileHandle): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(handle, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to store handle in IndexedDB', e);
  }
};

export const deleteStoredHandle = async (key: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to delete handle from IndexedDB', e);
  }
};

let activeTodoHandle: FileSystemFileHandle | null = null;
let activeArchiveHandle: FileSystemFileHandle | null = null;

export const getTodoFileHandle = async (): Promise<FileSystemFileHandle | null> => {
  if (activeTodoHandle) return activeTodoHandle;
  const handle = await getStoredHandle('todo_file_handle');
  if (handle) {
    activeTodoHandle = handle;
    return handle;
  }
  return null;
};

export const getArchiveFileHandle = async (): Promise<FileSystemFileHandle | null> => {
  if (activeArchiveHandle) return activeArchiveHandle;
  const handle = await getStoredHandle('archive_file_handle');
  if (handle) {
    activeArchiveHandle = handle;
    return handle;
  }
  return null;
};

export const setTodoFileHandle = async (handle: FileSystemFileHandle | null) => {
  activeTodoHandle = handle;
  if (handle) {
    await storeHandle('todo_file_handle', handle);
  } else {
    await deleteStoredHandle('todo_file_handle');
  }
};

export const setArchiveFileHandle = async (handle: FileSystemFileHandle | null) => {
  activeArchiveHandle = handle;
  if (handle) {
    await storeHandle('archive_file_handle', handle);
  } else {
    await deleteStoredHandle('archive_file_handle');
  }
};

export const verifyFilePermission = async (
  fileHandle: FileSystemFileHandle,
  readWrite: boolean,
  requestIfMissing: boolean = false
): Promise<boolean> => {
  const options: any = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  const state = await (fileHandle as any).queryPermission(options);
  if (state === 'granted') {
    return true;
  }
  if (requestIfMissing) {
    if ((await (fileHandle as any).requestPermission(options)) === 'granted') {
      return true;
    }
  }
  return false;
};

export const requestFileHandlePermission = async (type: 'todo' | 'archive'): Promise<boolean> => {
  const handle = type === 'todo' ? await getTodoFileHandle() : await getArchiveFileHandle();
  if (!handle) return false;
  return await verifyFilePermission(handle, true, true);
};

// --- ELECTRON NATIVE FILE API HELPERS ---

export const getElectronPaths = async (): Promise<{ todo: string | null; archive: string | null }> => {
  if (!window.electronAPI) return { todo: null, archive: null };
  return await window.electronAPI.getPaths();
};

export const setElectronPaths = async (todoPath: string | null, archivePath: string | null): Promise<void> => {
  if (!window.electronAPI) return;
  await window.electronAPI.setPaths(todoPath, archivePath);
};

export const selectElectronFile = async (title: string): Promise<string | null> => {
  if (!window.electronAPI) return null;
  return await window.electronAPI.selectFile(title);
};

const ensureCapacitorPermissions = async (): Promise<boolean> => {
  // On Android and iOS, standard directory access (like Directory.Documents)
  // does not require publicStorage permissions. Querying/requesting permissions
  // for publicStorage without manifest declarations triggers unnecessary prompts.
  return true;
};



export class LocalSyncProvider implements SyncProvider {
  async fetchTodoContent(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      await ensureCapacitorPermissions();
      try {
        const result = await Filesystem.readFile({
          path: 'todo.txt',
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        const text = result.data as string;
        localStorage.setItem(LOCAL_STORAGE_KEY, text);
        return text;
      } catch (e: any) {
        console.warn('Capacitor: Failed to read todo.txt. Might not exist yet.', e);
        const localContent = localStorage.getItem(LOCAL_STORAGE_KEY);
        return localContent !== null ? localContent : '';
      }
    }

    if (window.electronAPI) {
      const paths = await window.electronAPI.getPaths();
      if (paths.todo) {
        try {
          const text = await window.electronAPI.readFile(paths.todo);
          localStorage.setItem(LOCAL_STORAGE_KEY, text);
          return text;
        } catch (e: any) {
          console.error('Electron: Failed to read todo.txt', e);
          throw new Error('FILE_READ_FAILED');
        }
      }
      const localContent = localStorage.getItem(LOCAL_STORAGE_KEY);
      return localContent !== null ? localContent : '';
    }

    const handle = await getTodoFileHandle();
    if (handle) {
      const hasPerm = await verifyFilePermission(handle, false);
      if (hasPerm) {
        try {
          const file = await handle.getFile();
          const text = await file.text();
          localStorage.setItem(LOCAL_STORAGE_KEY, text);
          return text;
        } catch (e: any) {
          console.error('Failed to read from linked todo.txt handle', e);
          throw new Error('FILE_READ_FAILED');
        }
      } else {
        throw new Error('FILE_PERMISSION_REQUIRED');
      }
    }
    const localContent = localStorage.getItem(LOCAL_STORAGE_KEY);
    return localContent !== null ? localContent : '';
  }

  async saveTodoContent(content: string): Promise<string> {
    localStorage.setItem(LOCAL_STORAGE_KEY, content);

    if (Capacitor.isNativePlatform()) {
      await ensureCapacitorPermissions();
      try {
        await Filesystem.writeFile({
          path: 'todo.txt',
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
      } catch (e: any) {
        console.error('Capacitor: Failed to write todo.txt', e);
        throw new Error('FILE_WRITE_FAILED');
      }
      return content;
    }

    if (window.electronAPI) {
      const paths = await window.electronAPI.getPaths();
      if (paths.todo) {
        try {
          await window.electronAPI.writeFile(paths.todo, content);
        } catch (e: any) {
          console.error('Electron: Failed to write todo.txt', e);
          throw new Error('FILE_WRITE_FAILED');
        }
      }
      return content;
    }

    const handle = await getTodoFileHandle();
    if (handle) {
      const hasPerm = await verifyFilePermission(handle, true);
      if (hasPerm) {
        try {
          const writable = await handle.createWritable();
          await writable.write(content);
          await writable.close();
        } catch (e: any) {
          console.error('Failed to write to linked todo.txt handle', e);
          throw new Error('FILE_WRITE_FAILED');
        }
      } else {
        throw new Error('FILE_PERMISSION_REQUIRED');
      }
    }
    return content;
  }

  async fetchArchiveContent(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      await ensureCapacitorPermissions();
      try {
        const result = await Filesystem.readFile({
          path: 'archive.txt',
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        const text = result.data as string;
        localStorage.setItem(LOCAL_ARCHIVE_KEY, text);
        return text;
      } catch (e: any) {
        console.warn('Capacitor: Failed to read archive.txt. Might not exist yet.', e);
        const localContent = localStorage.getItem(LOCAL_ARCHIVE_KEY);
        return localContent !== null ? localContent : '';
      }
    }

    if (window.electronAPI) {
      const paths = await window.electronAPI.getPaths();
      if (paths.archive) {
        try {
          const text = await window.electronAPI.readFile(paths.archive);
          localStorage.setItem(LOCAL_ARCHIVE_KEY, text);
          return text;
        } catch (e: any) {
          console.error('Electron: Failed to read archive.txt', e);
          throw new Error('ARCHIVE_FILE_READ_FAILED');
        }
      }
      const localContent = localStorage.getItem(LOCAL_ARCHIVE_KEY);
      return localContent !== null ? localContent : '';
    }

    const handle = await getArchiveFileHandle();
    if (handle) {
      const hasPerm = await verifyFilePermission(handle, false);
      if (hasPerm) {
        try {
          const file = await handle.getFile();
          const text = await file.text();
          localStorage.setItem(LOCAL_ARCHIVE_KEY, text);
          return text;
        } catch (e: any) {
          console.error('Failed to read from linked archive.txt handle', e);
          throw new Error('ARCHIVE_FILE_READ_FAILED');
        }
      } else {
        throw new Error('ARCHIVE_FILE_PERMISSION_REQUIRED');
      }
    }
    const localContent = localStorage.getItem(LOCAL_ARCHIVE_KEY);
    return localContent !== null ? localContent : '';
  }

  async saveArchiveContent(content: string): Promise<string> {
    localStorage.setItem(LOCAL_ARCHIVE_KEY, content);

    if (Capacitor.isNativePlatform()) {
      await ensureCapacitorPermissions();
      try {
        await Filesystem.writeFile({
          path: 'archive.txt',
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
      } catch (e: any) {
        console.error('Capacitor: Failed to write archive.txt', e);
        throw new Error('ARCHIVE_FILE_WRITE_FAILED');
      }
      return content;
    }

    if (window.electronAPI) {
      const paths = await window.electronAPI.getPaths();
      if (paths.archive) {
        try {
          await window.electronAPI.writeFile(paths.archive, content);
        } catch (e: any) {
          console.error('Electron: Failed to write archive.txt', e);
          throw new Error('ARCHIVE_FILE_WRITE_FAILED');
        }
      }
      return content;
    }

    const handle = await getArchiveFileHandle();
    if (handle) {
      const hasPerm = await verifyFilePermission(handle, true);
      if (hasPerm) {
        try {
          const writable = await handle.createWritable();
          await writable.write(content);
          await writable.close();
        } catch (e: any) {
          console.error('Failed to write to linked archive.txt handle', e);
          throw new Error('ARCHIVE_FILE_WRITE_FAILED');
        }
      } else {
        throw new Error('ARCHIVE_FILE_PERMISSION_REQUIRED');
      }
    }
    return content;
  }

  async fetchConfigContent(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      await ensureCapacitorPermissions();
      try {
        const result = await Filesystem.readFile({
          path: 'todo.config.json',
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        const text = result.data as string;
        localStorage.setItem(LOCAL_CONFIG_KEY, text);
        return text;
      } catch (e: any) {
        console.warn('Capacitor: Failed to read config. Might not exist yet.', e);
        const localContent = localStorage.getItem(LOCAL_CONFIG_KEY);
        return localContent !== null ? localContent : '{}';
      }
    }

    const localContent = localStorage.getItem(LOCAL_CONFIG_KEY);
    return localContent !== null ? localContent : '{}';
  }

  async saveConfigContent(content: string): Promise<string> {
    localStorage.setItem(LOCAL_CONFIG_KEY, content);

    if (Capacitor.isNativePlatform()) {
      await ensureCapacitorPermissions();
      try {
        await Filesystem.writeFile({
          path: 'todo.config.json',
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
      } catch (e: any) {
        console.error('Capacitor: Failed to write config', e);
      }
    }

    return content;
  }

  async syncPendingChanges(): Promise<{ todoSynced: boolean; archiveSynced: boolean; configSynced: boolean }> {
    return { todoSynced: false, archiveSynced: false, configSynced: false };
  }
}
