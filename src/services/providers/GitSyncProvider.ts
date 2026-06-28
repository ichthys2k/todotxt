import type { SyncProvider } from './SyncProvider';

const GIT_PAT_KEY = 'todo_txt_git_pat';
const GIT_REPO_KEY = 'todo_txt_git_repo'; // e.g. "owner/repo"
const GIT_BRANCH_KEY = 'todo_txt_git_branch';

const GIT_TODO_SHA_KEY = 'todo_txt_git_todo_sha';
const GIT_ARCHIVE_SHA_KEY = 'todo_txt_git_archive_sha';
const GIT_CONFIG_SHA_KEY = 'todo_txt_git_config_sha';

const GIT_CACHE_TODO_KEY = 'todo_txt_git_cache_todo';
const GIT_CACHE_ARCHIVE_KEY = 'todo_txt_git_cache_archive';
const GIT_CACHE_CONFIG_KEY = 'todo_txt_git_cache_config';

const PENDING_SYNC_TODO_KEY = 'todo_txt_pending_sync_todo_git';
const PENDING_SYNC_ARCHIVE_KEY = 'todo_txt_pending_sync_archive_git';
const PENDING_SYNC_CONFIG_KEY = 'todo_txt_pending_sync_config_git';

export const getGitCredentials = () => {
  return {
    pat: localStorage.getItem(GIT_PAT_KEY) || '',
    repo: localStorage.getItem(GIT_REPO_KEY) || '',
    branch: localStorage.getItem(GIT_BRANCH_KEY) || 'main'
  };
};

export const setGitCredentials = (pat: string, repo: string, branch: string) => {
  localStorage.setItem(GIT_PAT_KEY, pat);
  localStorage.setItem(GIT_REPO_KEY, repo);
  localStorage.setItem(GIT_BRANCH_KEY, branch);
};

export const clearGitCredentials = () => {
  localStorage.removeItem(GIT_PAT_KEY);
  localStorage.removeItem(GIT_REPO_KEY);
  localStorage.removeItem(GIT_BRANCH_KEY);
  
  localStorage.removeItem(GIT_TODO_SHA_KEY);
  localStorage.removeItem(GIT_ARCHIVE_SHA_KEY);
  localStorage.removeItem(GIT_CONFIG_SHA_KEY);
  
  localStorage.removeItem(GIT_CACHE_TODO_KEY);
  localStorage.removeItem(GIT_CACHE_ARCHIVE_KEY);
  localStorage.removeItem(GIT_CACHE_CONFIG_KEY);
  
  localStorage.removeItem(PENDING_SYNC_TODO_KEY);
  localStorage.removeItem(PENDING_SYNC_ARCHIVE_KEY);
  localStorage.removeItem(PENDING_SYNC_CONFIG_KEY);
};

const encodeBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

const decodeBase64 = (str: string): string => {
  return decodeURIComponent(escape(atob(str)));
};

const githubApiCall = async (path: string, method: 'GET' | 'PUT', body?: any) => {
  const { pat, repo, branch } = getGitCredentials();
  if (!pat || !repo) throw new Error('GIT_NOT_CONFIGURED');

  const url = `https://api.github.com/repos/${repo}/contents/${path}${method === 'GET' ? `?ref=${branch}&_t=${Date.now()}` : ''}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${pat}`,
    'Accept': 'application/vnd.github.v3+json',
  };

  const options: RequestInit = { method, headers };

  if (body) {
    headers['Content-Type'] = 'application/json';
    body.branch = branch;
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  return res;
};

export const testGitConnection = async (pat: string, repo: string, branch: string): Promise<boolean> => {
  const url = `https://api.github.com/repos/${repo}/branches/${branch}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (res.ok) return true;
  if (res.status === 404) throw new Error('Repository oder Branch nicht gefunden.');
  if (res.status === 401) throw new Error('Token ungültig oder abgelaufen.');
  throw new Error(`Fehler: ${res.statusText}`);
};

export class GitSyncProvider implements SyncProvider {
  private async fetchFile(path: string, shaKey: string, cacheKey: string): Promise<string> {
    if (!navigator.onLine) {
      return localStorage.getItem(cacheKey) || '';
    }

    try {
      const res = await githubApiCall(path, 'GET');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(shaKey, data.sha);
        const text = decodeBase64(data.content);
        localStorage.setItem(cacheKey, text);
        return text;
      }
      if (res.status === 404) {
        localStorage.removeItem(shaKey);
        localStorage.setItem(cacheKey, '');
        return '';
      }
      throw new Error(`GitHub API Error: ${res.status}`);
    } catch (e) {
      console.warn(`Fehler beim Laden von ${path} via GitHub API:`, e);
      return localStorage.getItem(cacheKey) || '';
    }
  }

  private async saveFile(path: string, content: string, shaKey: string, cacheKey: string, pendingKey: string): Promise<string> {
    localStorage.setItem(cacheKey, content);

    if (!navigator.onLine) {
      localStorage.setItem(pendingKey, 'true');
      return content;
    }

    let sha = localStorage.getItem(shaKey);
    
    // Falls wir den SHA nicht kennen, versuchen wir ihn einmal zu fetchen
    if (!sha) {
      try {
        const res = await githubApiCall(path, 'GET');
        if (res.ok) {
          const data = await res.json();
          sha = data.sha;
        }
      } catch (e) {
        // Ignorieren, Datei existiert vielleicht einfach noch nicht
      }
    }

    try {
      const body: any = {
        message: `Update ${path} via Todo.txt`,
        content: encodeBase64(content)
      };
      if (sha) {
        body.sha = sha;
      }

      const res = await githubApiCall(path, 'PUT', body);
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(shaKey, data.content.sha);
        localStorage.removeItem(pendingKey);
        return content;
      } else if (res.status === 409) {
        // Conflict! Jemand anderes hat gepusht. Überschreibe mit lokalem Inhalt.
        console.warn(`Konflikt bei ${path} erkannt. Überschreibe mit lokalem Inhalt...`);
        
        // 1. Remote SHA abrufen um überschreiben zu können
        const getRes = await githubApiCall(path, 'GET');
        if (getRes.ok) {
          const data = await getRes.json();
          const remoteSha = data.sha;
          
          // 2. Erneuter Speicherversuch unter Verwendung unseres lokalen Inhalts aber mit dem remoteSha
          const retryBody: any = {
            message: `Overwriting conflict on ${path} via Todo.txt`,
            content: encodeBase64(content),
            sha: remoteSha
          };
          
          const retryRes = await githubApiCall(path, 'PUT', retryBody);
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            localStorage.setItem(shaKey, retryData.content.sha);
            localStorage.removeItem(pendingKey);
            console.log(`Überschreiben für ${path} erfolgreich abgeschlossen.`);
            return content;
          } else {
            throw new Error(`Überschreiben fehlgeschlagen (Fehler nach Überschreib-Versuch: ${retryRes.status})`);
          }
        } else {
          throw new Error(`Überschreiben fehlgeschlagen (Konnte remote Version nicht laden: ${getRes.status})`);
        }
      } else {
        throw new Error(`GitHub API Error: ${res.status}`);
      }
    } catch (e) {
      console.warn(`Speichern von ${path} auf GitHub fehlgeschlagen:`, e);
      localStorage.setItem(pendingKey, 'true');
      throw e;
    }
  }

  async fetchTodoContent(): Promise<string> {
    return await this.fetchFile('todo.txt', GIT_TODO_SHA_KEY, GIT_CACHE_TODO_KEY);
  }

  async saveTodoContent(content: string): Promise<string> {
    return await this.saveFile('todo.txt', content, GIT_TODO_SHA_KEY, GIT_CACHE_TODO_KEY, PENDING_SYNC_TODO_KEY);
  }

  async fetchArchiveContent(): Promise<string> {
    return await this.fetchFile('archive.txt', GIT_ARCHIVE_SHA_KEY, GIT_CACHE_ARCHIVE_KEY);
  }

  async saveArchiveContent(content: string): Promise<string> {
    return await this.saveFile('archive.txt', content, GIT_ARCHIVE_SHA_KEY, GIT_CACHE_ARCHIVE_KEY, PENDING_SYNC_ARCHIVE_KEY);
  }

  async fetchConfigContent(): Promise<string> {
    const content = await this.fetchFile('todo.config.json', GIT_CONFIG_SHA_KEY, GIT_CACHE_CONFIG_KEY);
    return content || '{}';
  }

  async saveConfigContent(content: string): Promise<string> {
    return await this.saveFile('todo.config.json', content, GIT_CONFIG_SHA_KEY, GIT_CACHE_CONFIG_KEY, PENDING_SYNC_CONFIG_KEY);
  }

  async syncPendingChanges(): Promise<{ todoSynced: boolean; archiveSynced: boolean; configSynced: boolean }> {
    if (!navigator.onLine) return { todoSynced: false, archiveSynced: false, configSynced: false };

    let todoSynced = false;
    let archiveSynced = false;
    let configSynced = false;

    if (localStorage.getItem(PENDING_SYNC_TODO_KEY) === 'true') {
      const content = localStorage.getItem(GIT_CACHE_TODO_KEY) || '';
      try {
        await this.saveFile('todo.txt', content, GIT_TODO_SHA_KEY, GIT_CACHE_TODO_KEY, PENDING_SYNC_TODO_KEY);
        todoSynced = true;
      } catch (e) { console.error(e); }
    }

    if (localStorage.getItem(PENDING_SYNC_ARCHIVE_KEY) === 'true') {
      const content = localStorage.getItem(GIT_CACHE_ARCHIVE_KEY) || '';
      try {
        await this.saveFile('archive.txt', content, GIT_ARCHIVE_SHA_KEY, GIT_CACHE_ARCHIVE_KEY, PENDING_SYNC_ARCHIVE_KEY);
        archiveSynced = true;
      } catch (e) { console.error(e); }
    }

    if (localStorage.getItem(PENDING_SYNC_CONFIG_KEY) === 'true') {
      const content = localStorage.getItem(GIT_CACHE_CONFIG_KEY) || '{}';
      try {
        await this.saveFile('todo.config.json', content, GIT_CONFIG_SHA_KEY, GIT_CACHE_CONFIG_KEY, PENDING_SYNC_CONFIG_KEY);
        configSynced = true;
      } catch (e) { console.error(e); }
    }

    return { todoSynced, archiveSynced, configSynced };
  }
}
