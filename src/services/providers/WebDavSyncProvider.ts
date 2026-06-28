import type { SyncProvider } from './SyncProvider';

const WEBDAV_URL_KEY = 'todo_txt_webdav_url';
const WEBDAV_USER_KEY = 'todo_txt_webdav_user';
const WEBDAV_PASSWORD_KEY = 'todo_txt_webdav_password';
const WEBDAV_PATH_KEY = 'todo_txt_webdav_path';

export const getWebDavCredentials = () => {
  return {
    url: localStorage.getItem(WEBDAV_URL_KEY) || '',
    user: localStorage.getItem(WEBDAV_USER_KEY) || '',
    password: localStorage.getItem(WEBDAV_PASSWORD_KEY) || ''
  };
};

export const setWebDavCredentials = (url: string, user: string, pass: string) => {
  localStorage.setItem(WEBDAV_URL_KEY, url);
  localStorage.setItem(WEBDAV_USER_KEY, user);
  localStorage.setItem(WEBDAV_PASSWORD_KEY, pass);
};

export const getWebDavPath = (): string | null => localStorage.getItem(WEBDAV_PATH_KEY);
export const setWebDavPath = (path: string) => localStorage.setItem(WEBDAV_PATH_KEY, path);
export const hasWebDavFileSelected = (): boolean => !!localStorage.getItem(WEBDAV_PATH_KEY);

export const clearWebDavCredentials = () => {
  localStorage.removeItem(WEBDAV_URL_KEY);
  localStorage.removeItem(WEBDAV_USER_KEY);
  localStorage.removeItem(WEBDAV_PASSWORD_KEY);
  localStorage.removeItem(WEBDAV_PATH_KEY);
};

const getWebDavHeaders = () => {
  const url = localStorage.getItem(WEBDAV_URL_KEY) || '';
  const user = localStorage.getItem(WEBDAV_USER_KEY) || '';
  const pass = localStorage.getItem(WEBDAV_PASSWORD_KEY) || '';
  const headers: Record<string, string> = {};
  if (user && pass) {
    headers['Authorization'] = 'Basic ' + btoa(unescape(encodeURIComponent(user + ':' + pass)));
  }
  return { url, headers };
};

const isElectronEnv = () =>
  typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');

const buildWebDavFetchArgs = (
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  body?: string,
  contentType?: string,
  extraHeaders?: Record<string, string>
) => {
  if (isElectronEnv()) {
    const hdrs: Record<string, string> = { ...headers, ...extraHeaders };
    if (body !== undefined) {
      hdrs['Content-Type'] = contentType || 'text/plain';
    }
    return { fetchUrl: targetUrl, fetchOpts: { method, headers: hdrs, body } as RequestInit };
  }

  const proxyUrl = new URL('webdav-proxy.php', window.location.href).href;
  const proxyHeaders: Record<string, string> = {
    ...headers,
    ...extraHeaders,
    'X-WebDAV-URL': targetUrl
  };
  
  let fetchMethod = method;
  if (method === 'PROPFIND') {
    fetchMethod = 'POST';
    proxyHeaders['X-HTTP-Method-Override'] = 'PROPFIND';
  }

  if (body !== undefined) {
    proxyHeaders['Content-Type'] = contentType || 'text/plain';
  }
  return { fetchUrl: proxyUrl, fetchOpts: { method: fetchMethod, headers: proxyHeaders, body } as RequestInit };
};

export const fetchWebDavFile = async (fileName: string): Promise<string> => {
  const { url, headers } = getWebDavHeaders();
  if (!url) throw new Error('WEBDAV_NOT_CONFIGURED');
  const storedPath = getWebDavPath();
  let baseUrl: string;
  if (storedPath) {
    baseUrl = url.replace(/\/+$/, '') + (storedPath.startsWith('/') ? '' : '/') + storedPath;
  } else {
    baseUrl = url;
  }
  const fileUrl = baseUrl.endsWith('/') ? baseUrl + fileName : baseUrl + '/' + fileName;
  const { fetchUrl, fetchOpts } = buildWebDavFetchArgs(fileUrl, 'GET', headers);
  try {
    const res = await fetch(fetchUrl, fetchOpts);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      if (contentType.includes('text/html') || text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
        throw new Error('WEBDAV_HTML_RESPONSE');
      }
      return text;
    }
    if (res.status === 404) {
      return '';
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('WEBDAV_AUTH_FAILED');
    }
    throw new Error(`WEBDAV_ERROR:${res.status}`);
  } catch (err: any) {
    if (err.message?.startsWith('WEBDAV_')) throw err;
    throw new Error('WEBDAV_CONNECTION_FAILED');
  }
};

export const saveWebDavFile = async (fileName: string, content: string): Promise<void> => {
  const { url, headers } = getWebDavHeaders();
  if (!url) throw new Error('WEBDAV_NOT_CONFIGURED');
  const storedPath = getWebDavPath();
  let baseUrl: string;
  if (storedPath) {
    baseUrl = url.replace(/\/+$/, '') + (storedPath.startsWith('/') ? '' : '/') + storedPath;
  } else {
    baseUrl = url;
  }
  const fileUrl = baseUrl.endsWith('/') ? baseUrl + fileName : baseUrl + '/' + fileName;
  const { fetchUrl, fetchOpts } = buildWebDavFetchArgs(fileUrl, 'PUT', headers, content);
  try {
    const res = await fetch(fetchUrl, fetchOpts);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('WEBDAV_AUTH_FAILED');
      }
      throw new Error(`WEBDAV_ERROR:${res.status}`);
    }
  } catch (err: any) {
    if (err.message?.startsWith('WEBDAV_')) throw err;
    throw new Error('WEBDAV_CONNECTION_FAILED');
  }
};

export const testWebDavConnection = async (url: string, user: string, pass: string): Promise<boolean> => {
  const headers: Record<string, string> = {};
  if (user && pass) {
    headers['Authorization'] = 'Basic ' + btoa(unescape(encodeURIComponent(user + ':' + pass)));
  }
  const targetUrl = url.endsWith('/') ? url : url + '/';
  const propfindBody = '<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>';
  const { fetchUrl, fetchOpts } = buildWebDavFetchArgs(
    targetUrl, 'PROPFIND', headers, propfindBody, 'application/xml', { 'Depth': '0' }
  );
  try {
    const res = await fetch(fetchUrl, fetchOpts);
    if (res.status === 207 || res.ok) {
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();
      if (contentType.includes('text/html') || text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
        throw new Error('WEBDAV_HTML_RESPONSE');
      }
      return true;
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('WEBDAV_AUTH_FAILED');
    }
    throw new Error(`WEBDAV_ERROR:${res.status}`);
  } catch (err: any) {
    if (err.message?.startsWith('WEBDAV_')) throw err;
    throw new Error('WEBDAV_CONNECTION_FAILED');
  }
};

export interface WebDavItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

export const listWebDavDirectory = async (dirPath: string): Promise<WebDavItem[]> => {
  const { url, headers } = getWebDavHeaders();
  if (!url) throw new Error('WEBDAV_NOT_CONFIGURED');

  const baseUrl = url.replace(/\/+$/, '');
  const targetUrl = baseUrl + (dirPath.startsWith('/') ? dirPath : '/' + dirPath);
  const normalizedTarget = targetUrl.endsWith('/') ? targetUrl : targetUrl + '/';

  const propfindBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:resourcetype/>
    <d:displayname/>
  </d:prop>
</d:propfind>`;

  const { fetchUrl, fetchOpts } = buildWebDavFetchArgs(
    normalizedTarget, 'PROPFIND', headers, propfindBody, 'application/xml', { 'Depth': '1' }
  );

  try {
    const res = await fetch(fetchUrl, fetchOpts);
    if (res.status === 401 || res.status === 403) {
      throw new Error('WEBDAV_AUTH_FAILED');
    }
    if (res.status !== 207 && !res.ok) {
      throw new Error(`WEBDAV_ERROR:${res.status}`);
    }

    const xmlText = await res.text();
    if (xmlText.trimStart().startsWith('<!DOCTYPE') || xmlText.trimStart().startsWith('<html')) {
      throw new Error('WEBDAV_HTML_RESPONSE');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const responses = doc.getElementsByTagNameNS('DAV:', 'response');

    const items: WebDavItem[] = [];
    const parsedUrl = new URL(normalizedTarget);
    const requestPath = decodeURIComponent(parsedUrl.pathname).replace(/\/+$/, '') + '/';

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const hrefEl = response.getElementsByTagNameNS('DAV:', 'href')[0];
      if (!hrefEl?.textContent) continue;

      const href = decodeURIComponent(hrefEl.textContent);
      const hrefClean = href.replace(/\/+$/, '') + '/';

      if (hrefClean === requestPath) continue;

      const resourceType = response.getElementsByTagNameNS('DAV:', 'resourcetype')[0];
      const isDirectory = !!resourceType?.getElementsByTagNameNS('DAV:', 'collection')[0];

      const hrefTrimmed = href.replace(/\/+$/, '');
      const name = hrefTrimmed.substring(hrefTrimmed.lastIndexOf('/') + 1);

      if (!name) continue;

      items.push({
        name,
        path: href,
        isDirectory
      });
    }

    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return items;
  } catch (err: any) {
    if (err.message?.startsWith('WEBDAV_')) throw err;
    throw new Error('WEBDAV_CONNECTION_FAILED');
  }
};

export const createWebDavFile = async (filePath: string): Promise<void> => {
  const { url, headers } = getWebDavHeaders();
  if (!url) throw new Error('WEBDAV_NOT_CONFIGURED');

  const baseUrl = url.replace(/\/+$/, '');
  const targetUrl = baseUrl + (filePath.startsWith('/') ? filePath : '/' + filePath);
  const { fetchUrl, fetchOpts } = buildWebDavFetchArgs(targetUrl, 'PUT', headers, '', 'text/plain');

  try {
    const res = await fetch(fetchUrl, fetchOpts);
    if (!res.ok && res.status !== 201 && res.status !== 204) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('WEBDAV_AUTH_FAILED');
      }
      throw new Error(`WEBDAV_ERROR:${res.status}`);
    }
  } catch (err: any) {
    if (err.message?.startsWith('WEBDAV_')) throw err;
    throw new Error('WEBDAV_CONNECTION_FAILED');
  }
};

export class WebDavSyncProvider implements SyncProvider {
  async fetchTodoContent(): Promise<string> {
    return await fetchWebDavFile('todo.txt');
  }

  async saveTodoContent(content: string): Promise<string> {
    await saveWebDavFile('todo.txt', content);
    return content;
  }

  async fetchArchiveContent(): Promise<string> {
    return await fetchWebDavFile('archive.txt');
  }

  async saveArchiveContent(content: string): Promise<string> {
    await saveWebDavFile('archive.txt', content);
    return content;
  }

  async fetchConfigContent(): Promise<string> {
    return await fetchWebDavFile('todo.config.json');
  }

  async saveConfigContent(content: string): Promise<string> {
    await saveWebDavFile('todo.config.json', content);
    return content;
  }

  async syncPendingChanges(): Promise<{ todoSynced: boolean; archiveSynced: boolean; configSynced: boolean }> {
    return { todoSynced: false, archiveSynced: false, configSynced: false };
  }
}
