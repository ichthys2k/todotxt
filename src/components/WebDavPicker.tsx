import { useState, useEffect } from 'react';
import { listWebDavDirectory, createWebDavFile, setWebDavPath, getWebDavCredentials, setWebDavCredentials, testWebDavConnection, type WebDavItem } from '../services/storageService';
import { Folder, FileText, ChevronRight, ArrowLeft, Plus, RefreshCw, HardDrive } from 'lucide-react';
import { PickerContainer } from './PickerContainer';

interface WebDavPickerProps {
  onFileSelected: () => void;
  onCancel?: () => void;
}

export const WebDavPicker = ({ onFileSelected, onCancel }: WebDavPickerProps) => {
  const [credentials, setCredentials] = useState(getWebDavCredentials());
  const { url } = credentials;

  // Form states
  const [webDavUrl, setWebDavUrl] = useState(url || '');
  const [webDavUser, setWebDavUser] = useState(credentials.user || '');
  const [webDavPass, setWebDavPass] = useState(credentials.password || '');
  const [webDavConnecting, setWebDavConnecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Extract the initial path from the WebDAV URL
  const getInitialPath = (): string => {
    try {
      const parsed = new URL(url);
      return parsed.pathname;
    } catch {
      return '/';
    }
  };

  const initialPath = getInitialPath();
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [pathHistory, setPathHistory] = useState<{ path: string; name: string }[]>([
    { path: initialPath, name: 'WebDAV' }
  ]);
  const [items, setItems] = useState<WebDavItem[]>([]);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('todo.txt');

  const handleWebDavSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webDavUrl.trim() || !webDavUser.trim() || !webDavPass.trim()) {
      setFormError('Bitte alle Felder ausfüllen.');
      return;
    }
    if (!webDavUrl.startsWith('https://') && !webDavUrl.startsWith('http://')) {
      setFormError('Die WebDAV-URL muss mit https:// (empfohlen) oder http:// beginnen.');
      return;
    }
    setFormError(null);
    setWebDavConnecting(true);
    try {
      await testWebDavConnection(webDavUrl.trim(), webDavUser.trim(), webDavPass.trim());
      setWebDavCredentials(webDavUrl.trim(), webDavUser.trim(), webDavPass.trim());
      setCredentials({ url: webDavUrl.trim(), user: webDavUser.trim(), password: webDavPass.trim() });
      setCurrentPath(new URL(webDavUrl.trim()).pathname || '/');
      setPathHistory([{ path: new URL(webDavUrl.trim()).pathname || '/', name: 'WebDAV' }]);
    } catch (err: any) {
      if (err.message === 'WEBDAV_AUTH_FAILED') {
        setFormError('Authentifizierung fehlgeschlagen. Bitte Benutzername und Passwort prüfen.');
      } else if (err.message === 'WEBDAV_HTML_RESPONSE') {
        setFormError('Der Server hat eine HTML-Seite statt einer WebDAV-Antwort geliefert. Bitte prüfe die URL.');
      } else if (err.message === 'WEBDAV_CONNECTION_FAILED') {
        setFormError('Verbindung zum WebDAV-Server fehlgeschlagen. Bitte URL prüfen.');
      } else if (err.message?.startsWith('WEBDAV_ERROR:')) {
        const status = err.message.split(':')[1];
        setFormError(`Server-Fehler (HTTP ${status}). Bitte URL und Zugangsdaten prüfen.`);
      } else {
        setFormError(err.message || 'Verbindung fehlgeschlagen.');
      }
    } finally {
      setWebDavConnecting(false);
    }
  };

  useEffect(() => {
    if (url) {
      loadItems(currentPath);
    }
  }, [currentPath, url]);

  const loadItems = async (path: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await listWebDavDirectory(path);
      setItems(result);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'WEBDAV_AUTH_FAILED') {
        setError('Authentifizierung fehlgeschlagen. Bitte prüfe deine Zugangsdaten.');
      } else if (err.message === 'WEBDAV_HTML_RESPONSE') {
        setError('Der Server hat eine HTML-Seite geliefert. Bitte prüfe die WebDAV-URL.');
      } else if (err.message === 'WEBDAV_CONNECTION_FAILED') {
        setError('Verbindung fehlgeschlagen. Bitte URL und Netzwerk prüfen.');
      } else {
        setError(err.message || 'Fehler beim Laden der Dateien.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (item: WebDavItem) => {
    const newPath = item.path;
    setPathHistory([...pathHistory, { path: newPath, name: item.name }]);
    setCurrentPath(newPath);
  };

  const handleBackClick = () => {
    if (pathHistory.length <= 1) return;
    const newHistory = [...pathHistory];
    newHistory.pop();
    setPathHistory(newHistory);
    setCurrentPath(newHistory[newHistory.length - 1].path);
  };

  const handleFileSelect = (_item: WebDavItem) => {
    // The path of the folder containing this file
    const folderPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
    setWebDavPath(folderPath);
    onFileSelected();
  };

  const handleCreateFile = async () => {
    try {
      if (!newFileName.trim()) return;
      setCreating(true);
      setError(null);

      const folderPath = currentPath.endsWith('/') ? currentPath : currentPath + '/';
      const filePath = folderPath + newFileName.trim();

      await createWebDavFile(filePath);

      // Store the folder path and trigger file selected
      setWebDavPath(folderPath);
      onFileSelected();
    } catch (err: any) {
      console.error(err);
      if (err.message === 'WEBDAV_AUTH_FAILED') {
        setError('Keine Berechtigung zum Erstellen von Dateien.');
      } else {
        setError(err.message || 'Fehler beim Erstellen der Datei.');
      }
      setCreating(false);
    }
  };

  const currentFolderName = pathHistory[pathHistory.length - 1].name;

  return (
    <PickerContainer
      title="Wähle deine todo.txt"
      description={!url ? "Verbinde dich mit deinem WebDAV Server" : "Navigiere durch dein WebDAV-Verzeichnis und wähle die Textdatei aus, die synchronisiert werden soll."}
      icon={<HardDrive className="w-6 h-6 text-indigo-600" />}
      onCancel={onCancel}
      maxWidth={!url ? "md" : "3xl"}
    >
      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm ${!url ? 'mt-4' : ''}`}>
        {!url ? (
          <form onSubmit={handleWebDavSubmit} className="p-6 space-y-4 text-left overflow-y-auto">
            {formError && (
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-200 text-sm mb-4">
                {formError}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">WebDAV Server-URL</label>
              <input
                type="url"
                required
                value={webDavUrl}
                onChange={(e) => setWebDavUrl(e.target.value)}
                placeholder="https://nextcloud.example.com/remote.php/dav/files/user/"
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Muss HTTPS sein. Bei Nextcloud z.B. /remote.php/webdav/
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Benutzername</label>
              <input
                type="text"
                required
                value={webDavUser}
                onChange={(e) => setWebDavUser(e.target.value)}
                placeholder="Nutzername"
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Passwort / App-Token</label>
              <input
                type="password"
                required
                value={webDavPass}
                onChange={(e) => setWebDavPass(e.target.value)}
                placeholder="Passwort"
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button 
              type="submit"
              disabled={webDavConnecting}
              className="w-full mt-2 relative flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer text-center disabled:opacity-70"
            >
              {webDavConnecting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Verbinden'
              )}
            </button>
          </form>
        ) : (
          <>
            {/* Header / Breadcrumbs */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50">
          <button 
            onClick={handleBackClick}
            disabled={pathHistory.length <= 1}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 font-medium truncate flex items-center gap-2">
            <Folder size={18} className="text-indigo-500 dark:text-indigo-400" />
            {currentFolderName}
          </div>
          <button 
            onClick={() => loadItems(currentPath)}
            disabled={loading}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {error && (
            <div className="m-4 p-4 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading && items.length === 0 ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <ul className="space-y-1">
              {items.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                  Dieser Ordner ist leer.
                </div>
              )}
              {items.map(item => (
                <li key={item.path}>
                  {item.isDirectory ? (
                    <button
                      onClick={() => handleFolderClick(item)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="text-blue-500 dark:text-blue-400 fill-blue-500/10 dark:fill-blue-400/20" size={20} />
                        <span className="truncate text-slate-800 dark:text-slate-200">{item.name}</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFileSelect(item)}
                      disabled={!item.name.toLowerCase().endsWith('.txt')}
                      className="w-full flex items-center p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors disabled:opacity-50 disabled:hover:bg-transparent group"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <FileText className={item.name.toLowerCase().endsWith('.txt') ? "text-slate-500 dark:text-slate-350" : "text-slate-300 dark:text-slate-600"} size={20} />
                        <span className="truncate flex-1 text-slate-700 dark:text-slate-300">{item.name}</span>
                        {item.name.toLowerCase().endsWith('.txt') && (
                          <span className="opacity-0 group-hover:opacity-100 text-xs bg-indigo-600 text-white px-2 py-1 rounded">Auswählen</span>
                        )}
                      </div>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / Create */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur">
          <div className="flex gap-3">
            <input 
              type="text" 
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Dateiname (z.B. todo.txt)"
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleCreateFile}
              disabled={creating || !newFileName.trim() || !newFileName.toLowerCase().endsWith('.txt')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              {creating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
              Hier erstellen
            </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Der Dateiname muss auf .txt enden.</p>
          </div>
          </>
        )}
      </div>
    </PickerContainer>
  );
};
