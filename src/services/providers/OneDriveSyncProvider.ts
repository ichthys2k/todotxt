import type { SyncProvider } from './SyncProvider';
import { getGraphAccessToken } from '../authService';

const ONEDRIVE_FILE_ID_KEY = 'todo_txt_onedrive_file_id';
const ONEDRIVE_FILE_NAME_KEY = 'todo_txt_onedrive_file_name';
const ONEDRIVE_FOLDER_ID_KEY = 'todo_txt_onedrive_folder_id';
const ONEDRIVE_ARCHIVE_FILE_ID_KEY = 'todo_txt_onedrive_archive_file_id';
const ONEDRIVE_ARCHIVE_FILE_NAME_KEY = 'todo_txt_onedrive_archive_file_name';

const ONEDRIVE_CACHE_TODO_KEY = 'todo_txt_onedrive_cache_todo';
const ONEDRIVE_CACHE_ARCHIVE_KEY = 'todo_txt_onedrive_cache_archive';
const ONEDRIVE_CACHE_CONFIG_KEY = 'todo_txt_onedrive_cache_config';
const PENDING_SYNC_TODO_KEY = 'todo_txt_pending_sync_todo';
const PENDING_SYNC_ARCHIVE_KEY = 'todo_txt_pending_sync_archive';
const PENDING_SYNC_CONFIG_KEY = 'todo_txt_pending_sync_config';

export const getSelectedFileId = (): string | null => localStorage.getItem(ONEDRIVE_FILE_ID_KEY);
export const getSelectedFileName = (): string | null => localStorage.getItem(ONEDRIVE_FILE_NAME_KEY);
export const getSelectedFolderId = (): string | null => localStorage.getItem(ONEDRIVE_FOLDER_ID_KEY);

export const getSelectedArchiveFileId = (): string | null => localStorage.getItem(ONEDRIVE_ARCHIVE_FILE_ID_KEY);
export const getSelectedArchiveFileName = (): string | null => localStorage.getItem(ONEDRIVE_ARCHIVE_FILE_NAME_KEY) || 'archive.txt';

export const setSelectedFile = (fileId: string, fileName: string, folderId: string) => {
  localStorage.setItem(ONEDRIVE_FILE_ID_KEY, fileId);
  localStorage.setItem(ONEDRIVE_FILE_NAME_KEY, fileName);
  localStorage.setItem(ONEDRIVE_FOLDER_ID_KEY, folderId);
};

export const setSelectedArchiveFile = (fileId: string, fileName: string) => {
  localStorage.setItem(ONEDRIVE_ARCHIVE_FILE_ID_KEY, fileId);
  localStorage.setItem(ONEDRIVE_ARCHIVE_FILE_NAME_KEY, fileName);
};

export const clearSelectedFile = () => {
  localStorage.removeItem(ONEDRIVE_FILE_ID_KEY);
  localStorage.removeItem(ONEDRIVE_FILE_NAME_KEY);
  localStorage.removeItem(ONEDRIVE_FOLDER_ID_KEY);
  localStorage.removeItem(ONEDRIVE_ARCHIVE_FILE_ID_KEY);
  localStorage.removeItem(ONEDRIVE_ARCHIVE_FILE_NAME_KEY);
  localStorage.removeItem(ONEDRIVE_CACHE_TODO_KEY);
  localStorage.removeItem(ONEDRIVE_CACHE_ARCHIVE_KEY);
  localStorage.removeItem(ONEDRIVE_CACHE_CONFIG_KEY);
  localStorage.removeItem(PENDING_SYNC_TODO_KEY);
  localStorage.removeItem(PENDING_SYNC_ARCHIVE_KEY);
  localStorage.removeItem(PENDING_SYNC_CONFIG_KEY);
};

export const hasPendingSync = (): boolean => {
  return localStorage.getItem(PENDING_SYNC_TODO_KEY) === 'true' || 
         localStorage.getItem(PENDING_SYNC_ARCHIVE_KEY) === 'true' ||
         localStorage.getItem(PENDING_SYNC_CONFIG_KEY) === 'true';
};

export class OneDriveSyncProvider implements SyncProvider {
  async fetchTodoContent(): Promise<string> {
    const fileId = getSelectedFileId();
    if (!fileId) throw new Error('NO_FILE_SELECTED');

    if (!navigator.onLine) {
      const cached = localStorage.getItem(ONEDRIVE_CACHE_TODO_KEY);
      return cached !== null ? cached : '';
    }

    try {
      const token = await getGraphAccessToken();
      if (!token) throw new Error('Nicht angemeldet oder kein Access Token vorhanden.');

      const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const text = await response.text();
        localStorage.setItem(ONEDRIVE_CACHE_TODO_KEY, text);
        return text;
      }

      if (response.status === 404) {
        clearSelectedFile();
        throw new Error('NO_FILE_SELECTED');
      }

      throw new Error(`Fehler beim Laden von OneDrive. Status: ${response.status}`);
    } catch (error: any) {
      if (error.message === 'NO_FILE_SELECTED') throw error;
      console.warn('Fehler bei fetchTodoContent. Nutze lokalen Cache falls vorhanden:', error);
      const cached = localStorage.getItem(ONEDRIVE_CACHE_TODO_KEY);
      if (cached !== null) return cached;
      throw error;
    }
  }

  private async mergeAndUpload(
    token: string,
    url: string,
    localContent: string,
    mergeStrategy: 'todo' | 'archive' | 'config'
  ): Promise<string> {
    let finalContent = localContent;
    try {
      const getResponse = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (getResponse.ok) {
        const remoteContent = await getResponse.text();
        if (mergeStrategy === 'config') {
          const { mergeConfigContents } = await import('../../utils/todoMerger');
          finalContent = mergeConfigContents(localContent, remoteContent);
        } else {
          const { mergeTodoContents } = await import('../../utils/todoMerger');
          finalContent = mergeTodoContents(localContent, remoteContent);
        }
      }
    } catch (e) {
      console.warn("Fehler beim Herunterladen für Merge:", e);
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': mergeStrategy === 'config' ? 'application/json' : 'text/plain'
      },
      body: finalContent
    });

    if (!response.ok) {
      throw new Error(`Fehler beim Speichern. Status: ${response.status}`);
    }
    
    // Wir geben response.json() zurück, falls vorhanden, sonst null.
    // Das wird für Archive (neu erstellte Datei) gebraucht.
    return finalContent;
  }


  async saveTodoContent(content: string): Promise<string> {
    const fileId = getSelectedFileId();
    if (!fileId) throw new Error('NO_FILE_SELECTED');

    localStorage.setItem(ONEDRIVE_CACHE_TODO_KEY, content);

    if (!navigator.onLine) {
      localStorage.setItem(PENDING_SYNC_TODO_KEY, 'true');
      return content;
    }

    try {
      const token = await getGraphAccessToken();
      if (!token) {
        localStorage.setItem(PENDING_SYNC_TODO_KEY, 'true');
        return content;
      }

      const url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
      const finalContent = await this.mergeAndUpload(token, url, content, 'todo');
      
      localStorage.setItem(ONEDRIVE_CACHE_TODO_KEY, finalContent);
      localStorage.removeItem(PENDING_SYNC_TODO_KEY);
      return finalContent;
    } catch (error: any) {
      if (error.message === 'NO_FILE_SELECTED') throw error;
      console.warn('Speichern in OneDrive fehlgeschlagen. Offline-Flag gesetzt:', error);
      localStorage.setItem(PENDING_SYNC_TODO_KEY, 'true');
    }
    return content;
  }

  async fetchArchiveContent(): Promise<string> {
    const archiveFileId = getSelectedArchiveFileId();
    const archiveFileName = getSelectedArchiveFileName();
    const folderId = getSelectedFolderId();

    if (!archiveFileId && !folderId) throw new Error('NO_FILE_SELECTED');

    if (!navigator.onLine) {
      const cached = localStorage.getItem(ONEDRIVE_CACHE_ARCHIVE_KEY);
      return cached !== null ? cached : '';
    }

    const getUrl = archiveFileId 
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${archiveFileId}/content`
      : (folderId === 'root'
          ? `https://graph.microsoft.com/v1.0/me/drive/root:/${archiveFileName}:/content`
          : `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${archiveFileName}:/content`);

    try {
      const token = await getGraphAccessToken();
      if (!token) throw new Error('Nicht angemeldet.');

      const response = await fetch(getUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const text = await response.text();
        localStorage.setItem(ONEDRIVE_CACHE_ARCHIVE_KEY, text);
        return text;
      }
      if (response.status === 404) {
        localStorage.setItem(ONEDRIVE_CACHE_ARCHIVE_KEY, '');
        return '';
      }
      
      throw new Error(`Fehler beim Laden von OneDrive. Status: ${response.status}`);
    } catch (error: any) {
      console.warn('Fehler bei fetchArchiveContent. Nutze lokalen Cache falls vorhanden:', error);
      const cached = localStorage.getItem(ONEDRIVE_CACHE_ARCHIVE_KEY);
      if (cached !== null) return cached;
      throw error;
    }
  }

  async saveArchiveContent(content: string): Promise<string> {
    const archiveFileId = getSelectedArchiveFileId();
    const archiveFileName = getSelectedArchiveFileName();
    const folderId = getSelectedFolderId();

    if (!archiveFileId && !folderId) throw new Error('NO_FILE_SELECTED');

    localStorage.setItem(ONEDRIVE_CACHE_ARCHIVE_KEY, content);

    if (!navigator.onLine) {
      localStorage.setItem(PENDING_SYNC_ARCHIVE_KEY, 'true');
      return content;
    }

    const putUrl = archiveFileId 
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${archiveFileId}/content`
      : (folderId === 'root'
          ? `https://graph.microsoft.com/v1.0/me/drive/root:/${archiveFileName}:/content`
          : `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${archiveFileName}:/content`);

    try {
      const token = await getGraphAccessToken();
      if (!token) {
        localStorage.setItem(PENDING_SYNC_ARCHIVE_KEY, 'true');
        return content;
      }

      const finalContent = await this.mergeAndUpload(token, putUrl, content, 'archive');
      
      localStorage.setItem(ONEDRIVE_CACHE_ARCHIVE_KEY, finalContent);
      localStorage.removeItem(PENDING_SYNC_ARCHIVE_KEY);

      if (!archiveFileId) {
        // Falls die Datei neu angelegt wurde, brauchen wir die FileId.
        // Dafür machen wir einen kurzen Abruf der Metadaten.
        try {
          const metaResponse = await fetch(putUrl.replace('/content', ''), {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (metaResponse.ok) {
            const data = await metaResponse.json();
            setSelectedArchiveFile(data.id, data.name);
          }
        } catch(e) {
          console.warn("Konnte Archive File ID nicht aktualisieren", e);
        }
      }
      return finalContent;
    } catch (error: any) {
      console.warn('Speichern des Archivs fehlgeschlagen. Offline-Flag gesetzt:', error);
      localStorage.setItem(PENDING_SYNC_ARCHIVE_KEY, 'true');
    }
    return content;
  }

  async fetchConfigContent(): Promise<string> {
    const folderId = getSelectedFolderId();
    if (!folderId) throw new Error('NO_FILE_SELECTED');

    if (!navigator.onLine) {
      const cached = localStorage.getItem(ONEDRIVE_CACHE_CONFIG_KEY);
      return cached !== null ? cached : '{}';
    }

    const configFileName = 'todo.config.json';
    const getUrl = folderId === 'root'
      ? `https://graph.microsoft.com/v1.0/me/drive/root:/${configFileName}:/content`
      : `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${configFileName}:/content`;

    try {
      const token = await getGraphAccessToken();
      if (!token) throw new Error('Nicht angemeldet oder kein Access Token vorhanden.');

      const response = await fetch(getUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const text = await response.text();
        localStorage.setItem(ONEDRIVE_CACHE_CONFIG_KEY, text);
        return text;
      }

      if (response.status === 404) {
        localStorage.setItem(ONEDRIVE_CACHE_CONFIG_KEY, '{}');
        return '{}';
      }

      throw new Error(`Fehler beim Laden der Konfiguration von OneDrive. Status: ${response.status}`);
    } catch (error: any) {
      console.warn('Fehler bei fetchConfigContent. Nutze lokalen Cache falls vorhanden:', error);
      const cached = localStorage.getItem(ONEDRIVE_CACHE_CONFIG_KEY);
      if (cached !== null) return cached;
      throw error;
    }
  }

  async saveConfigContent(content: string): Promise<string> {
    const folderId = getSelectedFolderId();
    if (!folderId) throw new Error('NO_FILE_SELECTED');

    localStorage.setItem(ONEDRIVE_CACHE_CONFIG_KEY, content);

    if (!navigator.onLine) {
      localStorage.setItem(PENDING_SYNC_CONFIG_KEY, 'true');
      return content;
    }

    const configFileName = 'todo.config.json';
    const putUrl = folderId === 'root'
      ? `https://graph.microsoft.com/v1.0/me/drive/root:/${configFileName}:/content`
      : `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${configFileName}:/content`;

    try {
      const token = await getGraphAccessToken();
      if (!token) {
        localStorage.setItem(PENDING_SYNC_CONFIG_KEY, 'true');
        return content;
      }

      const finalContent = await this.mergeAndUpload(token, putUrl, content, 'config');
      
      localStorage.setItem(ONEDRIVE_CACHE_CONFIG_KEY, finalContent);
      localStorage.removeItem(PENDING_SYNC_CONFIG_KEY);
      return finalContent;
    } catch (error: any) {
      console.warn('Speichern der Konfiguration fehlgeschlagen. Offline-Flag gesetzt:', error);
      localStorage.setItem(PENDING_SYNC_CONFIG_KEY, 'true');
    }
    return content;
  }

  async syncPendingChanges(): Promise<{ todoSynced: boolean; archiveSynced: boolean; configSynced: boolean }> {
    if (!navigator.onLine) return { todoSynced: false, archiveSynced: false, configSynced: false };

    let todoSynced = false;
    let archiveSynced = false;
    let configSynced = false;

    const needsTodoSync = localStorage.getItem(PENDING_SYNC_TODO_KEY) === 'true';
    const needsArchiveSync = localStorage.getItem(PENDING_SYNC_ARCHIVE_KEY) === 'true';
    const needsConfigSync = localStorage.getItem(PENDING_SYNC_CONFIG_KEY) === 'true';

    if (needsTodoSync) {
      const content = localStorage.getItem(ONEDRIVE_CACHE_TODO_KEY);
      if (content !== null) {
        try {
          const fileId = getSelectedFileId();
          if (fileId) {
            const token = await getGraphAccessToken();
            if (token) {
              const url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
              const finalContent = await this.mergeAndUpload(token, url, content, 'todo');
              localStorage.setItem(ONEDRIVE_CACHE_TODO_KEY, finalContent);
              localStorage.removeItem(PENDING_SYNC_TODO_KEY);
              todoSynced = true;
            }
          }
        } catch (err) {
          console.error("Fehler beim Synchronisieren der todo.txt:", err);
        }
      }
    }

    if (needsArchiveSync) {
      const content = localStorage.getItem(ONEDRIVE_CACHE_ARCHIVE_KEY);
      if (content !== null) {
        try {
          const archiveFileId = getSelectedArchiveFileId();
          const archiveFileName = getSelectedArchiveFileName();
          const folderId = getSelectedFolderId();
          if (archiveFileId || folderId) {
            const token = await getGraphAccessToken();
            if (token) {
              const putUrl = archiveFileId 
                ? `https://graph.microsoft.com/v1.0/me/drive/items/${archiveFileId}/content`
                : (folderId === 'root'
                    ? `https://graph.microsoft.com/v1.0/me/drive/root:/${archiveFileName}:/content`
                    : `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${archiveFileName}:/content`);
                    
              const finalContent = await this.mergeAndUpload(token, putUrl, content, 'archive');
              localStorage.setItem(ONEDRIVE_CACHE_ARCHIVE_KEY, finalContent);
              localStorage.removeItem(PENDING_SYNC_ARCHIVE_KEY);
              archiveSynced = true;
              
              if (!archiveFileId) {
                try {
                  const metaResponse = await fetch(putUrl.replace('/content', ''), {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (metaResponse.ok) {
                    const data = await metaResponse.json();
                    setSelectedArchiveFile(data.id, data.name);
                  }
                } catch(e) {}
              }
            }
          }
        } catch (err) {
          console.error("Fehler beim Synchronisieren der archive.txt:", err);
        }
      }
    }

    if (needsConfigSync) {
      const content = localStorage.getItem(ONEDRIVE_CACHE_CONFIG_KEY);
      if (content !== null) {
        try {
          const folderId = getSelectedFolderId();
          if (folderId) {
            const token = await getGraphAccessToken();
            if (token) {
              const configFileName = 'todo.config.json';
              const putUrl = folderId === 'root'
                ? `https://graph.microsoft.com/v1.0/me/drive/root:/${configFileName}:/content`
                : `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${configFileName}:/content`;
              
              const finalContent = await this.mergeAndUpload(token, putUrl, content, 'config');
              localStorage.setItem(ONEDRIVE_CACHE_CONFIG_KEY, finalContent);
              localStorage.removeItem(PENDING_SYNC_CONFIG_KEY);
              configSynced = true;
            }
          }
        } catch (err) {
          console.error("Fehler beim Synchronisieren der Konfiguration:", err);
        }
      }
    }

    return { todoSynced, archiveSynced, configSynced };
  }
}
