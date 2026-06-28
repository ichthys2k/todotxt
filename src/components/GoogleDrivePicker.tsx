import { useState, useEffect } from 'react';
import { getGoogleDriveToken, setGoogleDriveToken } from '../services/providers/GoogleDriveSyncProvider';
import { setSelectedGDriveFile, setSelectedGDriveArchiveFile } from '../services/storageService';
import { Folder, FileText, ChevronRight, ArrowLeft, Plus, RefreshCw, Cloud } from 'lucide-react';
import { PickerContainer } from './PickerContainer';
import { googleAuthService } from '../services/googleAuthService';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
}

interface GoogleDrivePickerProps {
  onFileSelected: () => void;
  onCancel?: () => void;
  mode?: 'todo' | 'archive';
}

export const GoogleDrivePicker = ({ onFileSelected, onCancel, mode = 'todo' }: GoogleDrivePickerProps) => {
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([{ id: 'root', name: 'Google Drive' }]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState(mode === 'todo' ? 'todo.txt' : 'archive.txt');

  const handleReauth = () => {
    setLoading(true);
    googleAuthService.login(
      (user) => {
        setGoogleDriveToken(user.token);
        if (user.id) {
          localStorage.setItem('todo_txt_gdrive_user_id', user.id);
        }
        loadItems(currentFolderId);
      },
      (err) => {
        console.error('Re-auth failed:', err);
        setError('Erneute Anmeldung fehlgeschlagen.');
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    loadItems(currentFolderId);
  }, [currentFolderId]);

  const loadItems = async (folderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = getGoogleDriveToken();
      if (!token) throw new Error('Nicht angemeldet.');

      // Build query: items inside the parent folder and not trashed
      const q = `'${folderId}' in parents and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)&pageSize=100`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Google-Sitzung abgelaufen. Bitte erneut anmelden.');
        }
        throw new Error(`Fehler beim Abrufen der Google Drive Dateien: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter: Folders and text files only
      const filtered = (data.files || []).filter((file: DriveItem) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const isTxtFile = file.mimeType === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
        return isFolder || isTxtFile;
      });

      // Sort: Folders first, then files alphabetically
      const sorted = filtered.sort((a: DriveItem, b: DriveItem) => {
        const isFolderA = a.mimeType === 'application/vnd.google-apps.folder';
        const isFolderB = b.mimeType === 'application/vnd.google-apps.folder';
        if (isFolderA && !isFolderB) return -1;
        if (!isFolderA && isFolderB) return 1;
        return a.name.localeCompare(b.name);
      });

      setItems(sorted);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler beim Laden der Google Drive Dateien.');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (item: DriveItem) => {
    setFolderHistory([...folderHistory, { id: item.id, name: item.name }]);
    setCurrentFolderId(item.id);
  };

  const handleBackClick = () => {
    if (folderHistory.length <= 1) return;
    const newHistory = [...folderHistory];
    newHistory.pop();
    setFolderHistory(newHistory);
    setCurrentFolderId(newHistory[newHistory.length - 1].id);
  };

  const handleFileSelect = (item: DriveItem) => {
    if (mode === 'archive') {
      setSelectedGDriveArchiveFile(item.id);
    } else {
      setSelectedGDriveFile(item.id);
    }
    onFileSelected();
  };

  const handleCreateFile = async () => {
    try {
      if (!newFileName.trim()) return;
      setCreating(true);
      setError(null);
      
      const token = getGoogleDriveToken();
      if (!token) throw new Error('Nicht angemeldet.');

      const metadata = {
        name: newFileName.trim(),
        mimeType: 'text/plain',
        parents: currentFolderId === 'root' ? [] : [currentFolderId]
      };

      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) throw new Error(`Fehler beim Erstellen der Datei: ${response.status}`);
      const data = await response.json();
      
      if (mode === 'archive') {
        setSelectedGDriveArchiveFile(data.id);
      } else {
        setSelectedGDriveFile(data.id);
      }
      onFileSelected();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler beim Erstellen der Datei.');
      setCreating(false);
    }
  };

  return (
    <PickerContainer
      title={mode === 'todo' ? "Wähle deine todo.txt (Google Drive)" : "Wähle deine archive.txt (Google Drive)"}
      description="Navigiere durch dein Google Drive und wähle die Textdatei aus oder erstelle eine neue im aktuellen Ordner."
      icon={<Cloud className="w-6 h-6 text-indigo-500" />}
      onCancel={onCancel}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden shadow-sm">
        {/* Header / Breadcrumbs */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50">
          <button 
            onClick={handleBackClick}
            disabled={folderHistory.length <= 1}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 font-medium truncate flex items-center gap-2">
            <Folder size={18} className="text-indigo-500 dark:text-indigo-400" />
            <span className="text-slate-700 dark:text-slate-300 text-sm md:text-base">
              {folderHistory.map((f, i) => (
                <span key={f.id}>
                  {i > 0 && <span className="mx-1.5 text-slate-400">/</span>}
                  {f.name}
                </span>
              ))}
            </span>
          </div>
          <button 
            onClick={() => loadItems(currentFolderId)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-955 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {error && (
            <div className="p-4 m-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex flex-col items-start gap-2.5 text-sm">
              <span>{error}</span>
              {(error.includes('Sitzung abgelaufen') || error.includes('Nicht angemeldet') || error.includes('401')) && (
                <button
                  onClick={handleReauth}
                  className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-red-200 dark:border-red-850"
                >
                  Jetzt neu anmelden
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 gap-3">
              <RefreshCw size={32} className="animate-spin text-indigo-500" />
              <span className="text-sm">Lade Dateien...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
              <Folder size={48} className="stroke-[1] mb-2 opacity-50" />
              <span className="text-sm">Dieser Ordner ist leer.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => {
                const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
                return (
                  <div 
                    key={item.id}
                    onClick={() => isFolder ? handleFolderClick(item) : handleFileSelect(item)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isFolder ? (
                        <Folder className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                    </div>
                    {isFolder && (
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-slate-650 transition-colors" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Footer for Creating File */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full sm:max-w-xs">
            <input 
              type="text" 
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              disabled={creating}
              placeholder={mode === 'todo' ? "todo.txt" : "archive.txt"}
              className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleCreateFile}
            disabled={creating || !newFileName.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Plus size={16} />
            <span>Erstellen</span>
          </button>
        </div>
      </div>
    </PickerContainer>
  );
};
