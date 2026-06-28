import { useState, useEffect } from 'react';
import { getGraphAccessToken } from '../services/authService';
import { setSelectedFile } from '../services/storageService';
import { Folder, FileText, ChevronRight, ArrowLeft, Plus, RefreshCw, Cloud } from 'lucide-react';
import { PickerContainer } from './PickerContainer';

interface DriveItem {
  id: string;
  name: string;
  folder?: any;
  file?: { mimeType: string };
}

interface OneDrivePickerProps {
  onFileSelected: () => void;
  onCancel?: () => void;
  mode?: 'todo' | 'archive';
}

export const OneDrivePicker = ({ onFileSelected, onCancel, mode = 'todo' }: OneDrivePickerProps) => {
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([{ id: 'root', name: 'OneDrive' }]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('todo.txt');

  useEffect(() => {
    loadItems(currentFolderId);
  }, [currentFolderId]);

  const loadItems = async (folderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getGraphAccessToken();
      if (!token) throw new Error('Nicht angemeldet.');

      const url = folderId === 'root' 
        ? 'https://graph.microsoft.com/v1.0/me/drive/root/children?$select=id,name,folder,file&$top=100'
        : `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children?$select=id,name,folder,file&$top=100`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Fehler: ${response.status}`);
      const data = await response.json();
      
      const sorted = (data.value || []).sort((a: DriveItem, b: DriveItem) => {
        if (a.folder && !b.folder) return -1;
        if (!a.folder && b.folder) return 1;
        return a.name.localeCompare(b.name);
      });

      setItems(sorted);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler beim Laden der Dateien.');
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
      import('../services/storageService').then(({ setSelectedArchiveFile }) => {
        setSelectedArchiveFile(item.id, item.name);
        onFileSelected();
      });
    } else {
      setSelectedFile(item.id, item.name, currentFolderId);
      onFileSelected();
    }
  };

  const handleCreateFile = async () => {
    try {
      if (!newFileName.trim()) return;
      setCreating(true);
      setError(null);
      
      const token = await getGraphAccessToken();
      if (!token) throw new Error('Nicht angemeldet.');

      const url = currentFolderId === 'root'
        ? `https://graph.microsoft.com/v1.0/me/drive/root:/${newFileName.trim()}:/content`
        : `https://graph.microsoft.com/v1.0/me/drive/items/${currentFolderId}:/${newFileName.trim()}:/content`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        },
        body: ''
      });

      if (!response.ok) throw new Error(`Fehler beim Erstellen: ${response.status}`);
      const data = await response.json();
      
      if (mode === 'archive') {
        const { setSelectedArchiveFile } = await import('../services/storageService');
        setSelectedArchiveFile(data.id, data.name);
      } else {
        setSelectedFile(data.id, data.name, currentFolderId);
      }
      onFileSelected();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Fehler beim Erstellen der Datei.');
      setCreating(false);
    }
  };

  const currentFolderName = folderHistory[folderHistory.length - 1].name;

  return (
    <PickerContainer
      title={mode === 'todo' ? "Wähle deine todo.txt" : "Wähle deine archive.txt"}
      description="Navigiere durch dein OneDrive und wähle die Textdatei aus, die synchronisiert werden soll, oder erstelle eine neue im aktuellen Ordner."
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
            {currentFolderName}
          </div>
          <button 
            onClick={() => loadItems(currentFolderId)}
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
                <li key={item.id}>
                  {item.folder ? (
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
      </div>
    </PickerContainer>
  );
};
