import { useState } from 'react';
import { PickerContainer } from './PickerContainer';
import { HardDrive, Monitor, Folder } from 'lucide-react';
import { 
  getElectronPaths, 
  setElectronPaths, 
  selectElectronFile,
  setTodoFileHandle 
} from '../services/storageService';

interface LocalPickerProps {
  onFileSelected: () => void;
  onCancel?: () => void;
}

export const LocalPicker = ({ onFileSelected, onCancel }: LocalPickerProps) => {
  const [error, setError] = useState<string | null>(null);
  
  const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
  const supportsFileSystemAccess = 'showOpenFilePicker' in window;

  const handleLinkLocal = async () => {
    setError(null);
    if (isElectron) {
      try {
        const filePath = await selectElectronFile('todo.txt auswählen');
        if (!filePath) return;
        const currentPaths = await getElectronPaths();
        await setElectronPaths(filePath, currentPaths.archive);
        localStorage.setItem('todo_txt_local_setup_complete', 'true');
        onFileSelected();
      } catch (err: any) {
        setError(err.message || 'Fehler beim Verknüpfen der Datei.');
      }
      return;
    }

    if (supportsFileSystemAccess) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'todo.txt',
            accept: { 'text/plain': ['.txt'] }
          }],
          multiple: false
        });
        if (handle) {
          await setTodoFileHandle(handle);
          localStorage.setItem('todo_txt_local_setup_complete', 'true');
          onFileSelected();
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('Fehler beim Dateizugriff: ' + err.message);
        }
      }
    } else {
      setError('Dein Browser unterstützt keine lokalen Dateien. Bitte nutze die Electron-App, Chrome, Edge oder Opera.');
    }
  };

  const handleBrowserStorage = () => {
    localStorage.setItem('todo_txt_local_setup_complete', 'true');
    onFileSelected();
  };

  return (
    <PickerContainer
      title="Lokaler Speicher"
      description="Wähle aus, wie du deine Aufgaben lokal speichern möchtest."
      icon={<Monitor className="w-6 h-6 text-slate-700 dark:text-slate-300" />}
      onCancel={onCancel}
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 mt-6 overflow-y-auto">
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {(isElectron || supportsFileSystemAccess) && (
          <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Folder className="w-5 h-5 text-indigo-500" />
              Lokale Datei verknüpfen
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Verknüpfe eine bestehende <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 text-xs">todo.txt</code> auf deiner Festplatte.
            </p>
            <button
              onClick={handleLinkLocal}
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Datei auswählen
            </button>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-3">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-slate-500" />
            Browser-Speicher nutzen
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Die Aufgaben werden nur im Cache deines Browsers gespeichert. Wenn du den Cache leerst, sind sie weg.
          </p>
          <button
            onClick={handleBrowserStorage}
            className="mt-2 w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-2.5 rounded-lg font-medium transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            Im Browser fortfahren
          </button>
        </div>
      </div>
    </PickerContainer>
  );
};
