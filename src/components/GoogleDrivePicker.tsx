import { useState } from 'react';
import useDrivePickerModule from 'react-google-drive-picker';
import { GOOGLE_CLIENT_ID, GOOGLE_API_KEY, GOOGLE_APP_ID } from '../main';
import { getGoogleDriveToken } from '../services/providers/GoogleDriveSyncProvider';
import { FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { PickerContainer } from './PickerContainer';

const useDrivePicker = (useDrivePickerModule as any).default || useDrivePickerModule;

interface GoogleDrivePickerProps {
  onFileSelected?: () => void;
  onCancel?: () => void;
}

export const GoogleDrivePicker = ({ onFileSelected, onCancel }: GoogleDrivePickerProps) => {
  const [openPicker] = useDrivePicker();
  const [todoId, setTodoId] = useState<string | null>(localStorage.getItem('todo_txt_gdrive_todo_id'));
  const [archiveId, setArchiveId] = useState<string | null>(localStorage.getItem('todo_txt_gdrive_archive_id'));

  const getCustomViews = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      const google = (window as any).google;
      
      const docsViewOwned = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false)
        .setOwnedByMe(true);
        
      const docsViewShared = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false)
        .setOwnedByMe(false);
        
      return [docsViewOwned, docsViewShared];
    }
    return undefined;
  };

  const handlePickTodo = () => {
    const token = getGoogleDriveToken();
    if (!token) return;

    const customViews = getCustomViews();

    openPicker({
      clientId: GOOGLE_CLIENT_ID,
      developerKey: GOOGLE_API_KEY,
      appId: GOOGLE_APP_ID,
      viewId: 'DOCS',
      token: token,
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: false,
      customViews: customViews,
      disableDefaultView: !!customViews,
      callbackFunction: (data: any) => {
        console.log('Google Picker Callback (Todo):', data);
        if (data.action === 'picked') {
          const id = data.docs[0].id;
          console.log('Google Picker picked Todo ID:', id);
          localStorage.setItem('todo_txt_gdrive_todo_id', id);
          setTodoId(id);
        }
      }
    });
  };

  const handlePickArchive = () => {
    const token = getGoogleDriveToken();
    if (!token) return;

    const customViews = getCustomViews();

    openPicker({
      clientId: GOOGLE_CLIENT_ID,
      developerKey: GOOGLE_API_KEY,
      appId: GOOGLE_APP_ID,
      viewId: 'DOCS',
      token: token,
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: false,
      customViews: customViews,
      disableDefaultView: !!customViews,
      callbackFunction: (data: any) => {
        console.log('Google Picker Callback (Archive):', data);
        if (data.action === 'picked') {
          const id = data.docs[0].id;
          console.log('Google Picker picked Archive ID:', id);
          localStorage.setItem('todo_txt_gdrive_archive_id', id);
          setArchiveId(id);
        }
      }
    });
  };

  const handleReset = () => {
    localStorage.removeItem('todo_txt_gdrive_todo_id');
    localStorage.removeItem('todo_txt_gdrive_archive_id');
    setTodoId(null);
    setArchiveId(null);
  };

  const handleFinish = () => {
    if (onFileSelected) {
      onFileSelected();
    } else {
      window.location.reload();
    }
  };

  const googleIcon = (
    <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );

  return (
    <PickerContainer
      title="Google Drive Dateien wählen"
      description={
        <>Bitte wähle deine bestehende <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">todo.txt</code> Datei aus deinem Google Drive aus.</>
      }
      icon={googleIcon}
      onCancel={onCancel}
      maxWidth="md"
    >
      <div className="w-full space-y-4 mt-4">
        {/* Todo File Picker */}
        <div className={`p-4 rounded-xl border-2 transition-colors flex items-center justify-between ${todoId ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
          <div className="flex items-center gap-3">
            {todoId ? <CheckCircle2 className="text-green-500" /> : <AlertCircle className="text-slate-400" />}
            <div className="text-left">
              <div className="font-bold text-slate-800 dark:text-slate-200">todo.txt</div>
              <div className="text-xs text-slate-500">{todoId ? 'Ausgewählt' : 'Nicht ausgewählt'}</div>
            </div>
          </div>
          <button
            onClick={handlePickTodo}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {todoId ? 'Ändern' : 'Wählen'}
          </button>
        </div>

        {/* Archive File Picker */}
        <div className={`p-4 rounded-xl border-2 transition-colors flex items-center justify-between ${archiveId ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
          <div className="flex items-center gap-3">
            {archiveId ? <CheckCircle2 className="text-green-500" /> : <FileText className="text-slate-400" />}
            <div className="text-left">
              <div className="font-bold text-slate-800 dark:text-slate-200">archive.txt (Optional)</div>
              <div className="text-xs text-slate-500">{archiveId ? 'Ausgewählt' : 'Nicht ausgewählt'}</div>
            </div>
          </div>
          <button
            onClick={handlePickArchive}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {archiveId ? 'Ändern' : 'Wählen'}
          </button>
        </div>
      </div>

      {(todoId || archiveId) && (
        <div className="w-full mt-8 flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={18} />
          </button>
          
          <button
            onClick={handleFinish}
            disabled={!todoId}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Los geht's
          </button>
        </div>
      )}
    </PickerContainer>
  );
};
