import type { SyncProvider } from './SyncProvider';

const GDRIVE_TOKEN_KEY = 'todo_txt_gdrive_token';
const GDRIVE_TODO_ID_KEY = 'todo_txt_gdrive_todo_id';
const GDRIVE_ARCHIVE_ID_KEY = 'todo_txt_gdrive_archive_id';
const GDRIVE_CONFIG_ID_KEY = 'todo_txt_gdrive_config_id';

const GDRIVE_CACHE_TODO_KEY = 'todo_txt_gdrive_cache_todo';
const GDRIVE_CACHE_ARCHIVE_KEY = 'todo_txt_gdrive_cache_archive';
const GDRIVE_CACHE_CONFIG_KEY = 'todo_txt_gdrive_cache_config';

const PENDING_SYNC_TODO_KEY = 'todo_txt_pending_sync_todo_gdrive';
const PENDING_SYNC_ARCHIVE_KEY = 'todo_txt_pending_sync_archive_gdrive';
const PENDING_SYNC_CONFIG_KEY = 'todo_txt_pending_sync_config_gdrive';

export const setGoogleDriveToken = (token: string) => {
  localStorage.setItem(GDRIVE_TOKEN_KEY, token);
};

export const getGoogleDriveToken = (): string | null => {
  return localStorage.getItem(GDRIVE_TOKEN_KEY);
};

export const clearGoogleDriveCredentials = () => {
  localStorage.removeItem(GDRIVE_TOKEN_KEY);
  localStorage.removeItem(GDRIVE_TODO_ID_KEY);
  localStorage.removeItem(GDRIVE_ARCHIVE_ID_KEY);
  localStorage.removeItem(GDRIVE_CONFIG_ID_KEY);
  localStorage.removeItem(GDRIVE_CACHE_TODO_KEY);
  localStorage.removeItem(GDRIVE_CACHE_ARCHIVE_KEY);
  localStorage.removeItem(GDRIVE_CACHE_CONFIG_KEY);
  localStorage.removeItem(PENDING_SYNC_TODO_KEY);
  localStorage.removeItem(PENDING_SYNC_ARCHIVE_KEY);
  localStorage.removeItem(PENDING_SYNC_CONFIG_KEY);
};

export class GoogleDriveSyncProvider implements SyncProvider {
  private getFileIdFromStorage(idKey: string): string | null {
    return localStorage.getItem(idKey);
  }

  private async getParentId(token: string): Promise<string> {
    const todoFileId = localStorage.getItem(GDRIVE_TODO_ID_KEY);
    if (!todoFileId) throw new Error('GDRIVE_FILE_NOT_SELECTED');

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${todoFileId}?fields=parents`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error(`Google Drive API Error: ${res.status}`);
    const data = await res.json();
    if (data.parents && data.parents.length > 0) {
      return data.parents[0];
    }
    return 'root';
  }

  private async getOrCreateFileIdByName(filename: string, idKey: string, token: string): Promise<string> {
    let fileId = localStorage.getItem(idKey);
    if (fileId) return fileId;

    let parentId = 'root';
    try {
      parentId = await this.getParentId(token);
    } catch (e) {
      console.warn("Failed to get parent ID of todo.txt:", e);
    }

    try {
      const q = encodeURIComponent(`'${parentId}' in parents and name = '${filename}' and trashed = false`);
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          const existingId = searchData.files[0].id;
          localStorage.setItem(idKey, existingId);
          return existingId;
        }
      }
    } catch (e) {
      console.warn(`Search for ${filename} failed:`, e);
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: filename,
        parents: [parentId],
        mimeType: filename.endsWith('.json') ? 'application/json' : 'text/plain'
      })
    });

    if (!createRes.ok) {
      throw new Error(`Google Drive API Error (Create File): ${createRes.status}`);
    }

    const createdData = await createRes.json();
    const newId = createdData.id;
    localStorage.setItem(idKey, newId);
    return newId;
  }

  private async fetchFile(filename: string, idKey: string, cacheKey: string): Promise<string> {
    if (!navigator.onLine) {
      return localStorage.getItem(cacheKey) || '';
    }

    try {
      const token = getGoogleDriveToken();
      if (!token) throw new Error('GDRIVE_NOT_AUTHENTICATED');

      let fileId = this.getFileIdFromStorage(idKey);
      console.log(`[GDrive] fetchFile diagnostics - filename: ${filename}, idKey: ${idKey}, fileId in storage:`, fileId);
      if (!fileId) {
        if (idKey === GDRIVE_TODO_ID_KEY) {
          console.warn('[GDrive] GDRIVE_FILE_NOT_SELECTED will be thrown for:', filename);
          throw new Error('GDRIVE_FILE_NOT_SELECTED');
        } else {
          fileId = await this.getOrCreateFileIdByName(filename, idKey, token);
          console.log(`[GDrive] Auto-created/retrieved fileId for ${filename}:`, fileId);
        }
      }

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) throw new Error('GDRIVE_TOKEN_EXPIRED');
      if (res.status === 404) {
        localStorage.removeItem(idKey);
        return '';
      }
      if (!res.ok) {
        let errorMsg = `Google Drive API Error: ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error?.message) {
            errorMsg = `Google Drive API Error: ${res.status} - ${errData.error.message}`;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const text = await res.text();
      localStorage.setItem(cacheKey, text);
      return text;
    } catch (e: any) {
      console.warn(`Fehler beim Laden von ${filename} via Google Drive API:`, e);
      if (e.message === 'GDRIVE_TOKEN_EXPIRED') throw e;
      if (e.message === 'GDRIVE_FILE_NOT_SELECTED') throw e;
      throw e;
    }
  }

  private async saveFile(filename: string, content: string, idKey: string, cacheKey: string, pendingKey: string): Promise<string> {
    localStorage.setItem(cacheKey, content);

    if (!navigator.onLine) {
      localStorage.setItem(pendingKey, 'true');
      return content;
    }

    try {
      const token = getGoogleDriveToken();
      if (!token) throw new Error('GDRIVE_NOT_AUTHENTICATED');

      let fileId = this.getFileIdFromStorage(idKey);
      console.log(`[GDrive] saveFile diagnostics - filename: ${filename}, idKey: ${idKey}, fileId in storage:`, fileId);
      if (!fileId) {
        if (idKey === GDRIVE_TODO_ID_KEY) {
          console.warn('[GDrive] GDRIVE_FILE_NOT_SELECTED will be thrown for:', filename);
          throw new Error('GDRIVE_FILE_NOT_SELECTED');
        } else {
          fileId = await this.getOrCreateFileIdByName(filename, idKey, token);
          console.log(`[GDrive] Auto-created/retrieved fileId for ${filename}:`, fileId);
        }
      }

      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        },
        body: content
      });

      if (res.status === 401) throw new Error('GDRIVE_TOKEN_EXPIRED');
      if (res.status === 404) {
        localStorage.removeItem(idKey);
        throw new Error('GDRIVE_FILE_NOT_FOUND');
      } else if (!res.ok) {
        let errorMsg = `Google Drive API Error: ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error?.message) {
            errorMsg = `Google Drive API Error: ${res.status} - ${errData.error.message}`;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      localStorage.removeItem(pendingKey);
      return content;
    } catch (e: any) {
      console.warn(`Speichern von ${filename} in Google Drive fehlgeschlagen:`, e);
      localStorage.setItem(pendingKey, 'true');
      if (e.message === 'GDRIVE_TOKEN_EXPIRED') throw e;
      if (e.message === 'GDRIVE_FILE_NOT_SELECTED') throw e;
      throw e;
    }
  }

  async fetchTodoContent(): Promise<string> {
    return await this.fetchFile('todo.txt', GDRIVE_TODO_ID_KEY, GDRIVE_CACHE_TODO_KEY);
  }

  async saveTodoContent(content: string): Promise<string> {
    return await this.saveFile('todo.txt', content, GDRIVE_TODO_ID_KEY, GDRIVE_CACHE_TODO_KEY, PENDING_SYNC_TODO_KEY);
  }

  async fetchArchiveContent(): Promise<string> {
    return await this.fetchFile('archive.txt', GDRIVE_ARCHIVE_ID_KEY, GDRIVE_CACHE_ARCHIVE_KEY);
  }

  async saveArchiveContent(content: string): Promise<string> {
    return await this.saveFile('archive.txt', content, GDRIVE_ARCHIVE_ID_KEY, GDRIVE_CACHE_ARCHIVE_KEY, PENDING_SYNC_ARCHIVE_KEY);
  }

  async fetchConfigContent(): Promise<string> {
    const content = await this.fetchFile('todo.config.json', GDRIVE_CONFIG_ID_KEY, GDRIVE_CACHE_CONFIG_KEY);
    return content || '{}';
  }

  async saveConfigContent(content: string): Promise<string> {
    return await this.saveFile('todo.config.json', content, GDRIVE_CONFIG_ID_KEY, GDRIVE_CACHE_CONFIG_KEY, PENDING_SYNC_CONFIG_KEY);
  }

  async syncPendingChanges(): Promise<{ todoSynced: boolean; archiveSynced: boolean; configSynced: boolean }> {
    if (!navigator.onLine) return { todoSynced: false, archiveSynced: false, configSynced: false };

    let todoSynced = false;
    let archiveSynced = false;
    let configSynced = false;

    if (localStorage.getItem(PENDING_SYNC_TODO_KEY) === 'true') {
      const content = localStorage.getItem(GDRIVE_CACHE_TODO_KEY) || '';
      try {
        await this.saveFile('todo.txt', content, GDRIVE_TODO_ID_KEY, GDRIVE_CACHE_TODO_KEY, PENDING_SYNC_TODO_KEY);
        todoSynced = true;
      } catch (e) { console.error(e); }
    }

    if (localStorage.getItem(PENDING_SYNC_ARCHIVE_KEY) === 'true') {
      const content = localStorage.getItem(GDRIVE_CACHE_ARCHIVE_KEY) || '';
      try {
        await this.saveFile('archive.txt', content, GDRIVE_ARCHIVE_ID_KEY, GDRIVE_CACHE_ARCHIVE_KEY, PENDING_SYNC_ARCHIVE_KEY);
        archiveSynced = true;
      } catch (e) { console.error(e); }
    }

    if (localStorage.getItem(PENDING_SYNC_CONFIG_KEY) === 'true') {
      const content = localStorage.getItem(GDRIVE_CACHE_CONFIG_KEY) || '{}';
      try {
        await this.saveFile('todo.config.json', content, GDRIVE_CONFIG_ID_KEY, GDRIVE_CACHE_CONFIG_KEY, PENDING_SYNC_CONFIG_KEY);
        configSynced = true;
      } catch (e) { console.error(e); }
    }

    return { todoSynced, archiveSynced, configSynced };
  }
}
