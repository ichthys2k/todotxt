import type { SyncProvider } from './providers/SyncProvider';
import { LocalSyncProvider } from './providers/LocalSyncProvider';
import { OneDriveSyncProvider } from './providers/OneDriveSyncProvider';
import { WebDavSyncProvider } from './providers/WebDavSyncProvider';
import { GitSyncProvider } from './providers/GitSyncProvider';
import { GoogleDriveSyncProvider } from './providers/GoogleDriveSyncProvider';

export * from './providers/LocalSyncProvider';
export * from './providers/OneDriveSyncProvider';
export * from './providers/WebDavSyncProvider';
export * from './providers/GitSyncProvider';
export * from './providers/GoogleDriveSyncProvider';

type StorageMode = 'local' | 'onedrive' | 'webdav' | 'git' | 'gdrive';

const providers: Record<StorageMode, SyncProvider> = {
  local: new LocalSyncProvider(),
  onedrive: new OneDriveSyncProvider(),
  webdav: new WebDavSyncProvider(),
  git: new GitSyncProvider(),
  gdrive: new GoogleDriveSyncProvider()
};

export const getProvider = (storageMode: StorageMode): SyncProvider => {
  return providers[storageMode];
};

export const hasGDriveFileSelected = (): boolean => {
  return !!localStorage.getItem('todo_txt_gdrive_todo_id');
};

export const fetchTodoContent = async (storageMode: StorageMode): Promise<string> => {
  return await getProvider(storageMode).fetchTodoContent();
};

export const saveTodoContent = async (storageMode: StorageMode, content: string): Promise<string> => {
  return await getProvider(storageMode).saveTodoContent(content);
};

export const fetchArchiveContent = async (storageMode: StorageMode): Promise<string> => {
  return await getProvider(storageMode).fetchArchiveContent();
};

export const saveArchiveContent = async (storageMode: StorageMode, content: string): Promise<string> => {
  return await getProvider(storageMode).saveArchiveContent(content);
};

export const fetchConfigContent = async (storageMode: StorageMode): Promise<string> => {
  return await getProvider(storageMode).fetchConfigContent();
};

export const saveConfigContent = async (storageMode: StorageMode, content: string): Promise<string> => {
  return await getProvider(storageMode).saveConfigContent(content);
};

export const syncPendingChanges = async (storageMode: StorageMode): Promise<{ todoSynced: boolean; archiveSynced: boolean; configSynced: boolean }> => {
  return await getProvider(storageMode).syncPendingChanges();
};

export const archiveTasks = async (storageMode: StorageMode, tasksToArchiveStr: string): Promise<void> => {
  if (!tasksToArchiveStr.trim()) return;

  let existingContent = '';
  try {
    existingContent = await fetchArchiveContent(storageMode);
  } catch (e) {
    console.warn("Konnte Archiv nicht laden:", e);
  }

  const newContent = existingContent 
    ? (existingContent.endsWith('\n') ? existingContent + tasksToArchiveStr : existingContent + '\n' + tasksToArchiveStr)
    : tasksToArchiveStr;

  await saveArchiveContent(storageMode, newContent);
};

export const restoreTasks = async (storageMode: StorageMode, tasksToRestoreStr: string): Promise<void> => {
  if (!tasksToRestoreStr.trim()) return;
  
  const existingContent = await fetchTodoContent(storageMode);
  const newContent = existingContent 
    ? (existingContent.endsWith('\n') ? existingContent + tasksToRestoreStr : existingContent + '\n' + tasksToRestoreStr)
    : tasksToRestoreStr;
    
  await saveTodoContent(storageMode, newContent);
};

export const getTodoLastModified = async (storageMode: StorageMode): Promise<number> => {
  const provider = getProvider(storageMode);
  if ('getTodoLastModified' in provider && typeof (provider as any).getTodoLastModified === 'function') {
    return await (provider as any).getTodoLastModified();
  }
  return 0;
};

export const getArchiveLastModified = async (storageMode: StorageMode): Promise<number> => {
  const provider = getProvider(storageMode);
  if ('getArchiveLastModified' in provider && typeof (provider as any).getArchiveLastModified === 'function') {
    return await (provider as any).getArchiveLastModified();
  }
  return 0;
};
