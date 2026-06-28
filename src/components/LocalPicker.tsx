import { useState } from 'react';
import { PickerContainer } from './PickerContainer';
import { HardDrive, Monitor, Folder } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { 
  getElectronPaths, 
  setElectronPaths, 
  selectElectronFile,
  setTodoFileHandle 
} from '../services/storageService';

const SafStorage = registerPlugin<any>('SafStorage');

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
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await SafStorage.chooseFolder();
        if (res && res.uri) {
          localStorage.setItem('todo_txt_saf_folder_uri', res.uri);
          localStorage.setItem('todo_txt_local_setup_complete', 'true');
          onFileSelected();
        }
      } catch (err: any) {
        if (!err.message?.includes('cancelled')) {
          setError('Fehler bei der Ordnerauswahl: ' + err.message);
        }
      }
      return;
    }

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
          localStorage.setItem('todo_txt_uses_file_handle', 'true');
          localStorage.setItem('todo_txt_local_setup_complete', 'true');
          onFileSelected();
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError('Fehler beim Dateizugriff: ' + err.message);
        }
      }
    }
  };

  const isSupported = isElectron || supportsFileSystemAccess || Capacitor.isNativePlatform();

  return (
    <PickerContainer
      title="Lokaler Speicher"
      description={isSupported ? "Verknüpfe eine echte todo.txt Datei auf deinem Gerät." : "Lokaler Speicher wird von deinem Browser nicht unterstützt."}
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

        {isSupported ? (
          Capacitor.isNativePlatform() ? (
            <div className="border border-slate-200 dark:border-slate-800 p-5 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Folder className="w-5 h-5 text-indigo-500" />
                Lokalen Ordner verknüpfen
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Wähle den Ordner auf deinem Handy aus, in dem die Dateien <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 text-xs">todo.txt</code> und <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 text-xs">archive.txt</code> liegen oder erstellt werden sollen (z.B. dein Synology Drive Ordner).
              </p>
              <button
                onClick={handleLinkLocal}
                className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Ordner auswählen
              </button>
            </div>
          ) : (
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
          )
        ) : (
          <div className="border border-red-200 dark:border-red-900/30 p-5 rounded-xl bg-red-50/50 dark:bg-red-950/10 shadow-sm flex flex-col gap-3">
            <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Browser-Einschränkung
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Dein aktueller Browser unterstützt keinen direkten Zugriff auf lokale Dateien. Um Aufgaben zu speichern, hast du folgende Möglichkeiten:
            </p>
            <ul className="text-xs text-slate-555 dark:text-slate-400 list-disc list-inside space-y-1.5 ml-1">
              <li>Nutze einen modernen Desktop-Browser wie <strong>Chrome</strong>, <strong>Edge</strong> oder <strong>Opera</strong>.</li>
              <li>Verwende die native <strong>Desktop-App</strong> oder die <strong>Android-App</strong>.</li>
              <li>Verbinde die App stattdessen mit einem <strong>Cloud-Dienst</strong> (Microsoft OneDrive, Google Drive, Git oder WebDAV).</li>
            </ul>
            {onCancel && (
              <button
                onClick={onCancel}
                className="mt-2 w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Zurück zur Sync-Auswahl
              </button>
            )}
          </div>
        )}
      </div>
    </PickerContainer>
  );
};
