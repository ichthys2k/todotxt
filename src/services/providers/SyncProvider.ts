export interface SyncProvider {
  /**
   * Fetches the content of the main todo list.
   */
  fetchTodoContent(): Promise<string>;

  /**
   * Saves the content to the main todo list.
   * Returns the final saved content (which may be merged during conflicts).
   */
  saveTodoContent(content: string): Promise<string>;

  /**
   * Fetches the content of the archive list.
   */
  fetchArchiveContent(): Promise<string>;

  /**
   * Saves the content to the archive list.
   * Returns the final saved content.
   */
  saveArchiveContent(content: string): Promise<string>;

  /**
   * Fetches the content of the configuration file.
   */
  fetchConfigContent(): Promise<string>;

  /**
   * Saves the content to the configuration file.
   * Returns the final saved content.
   */
  saveConfigContent(content: string): Promise<string>;

  /**
   * Synchronizes any pending changes that were made offline.
   * Returns an object indicating which files were successfully synced.
   */
  syncPendingChanges(): Promise<{ todoSynced: boolean; archiveSynced: boolean; configSynced: boolean }>;
}
