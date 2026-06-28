import { getGoogleDriveToken } from './providers/GoogleDriveSyncProvider';

export interface SyncProfile {
  id: string;
  name: string;
  type: 'onedrive' | 'webdav' | 'git' | 'gdrive' | 'local';
  webdavUrl?: string;
  webdavUser?: string;
  webdavPassword?: string;
  webdavPath?: string;
  gitPat?: string;
  gitRepo?: string;
  gitBranch?: string;
  gdriveTodoId?: string;
  gdriveArchiveId?: string;
}

// Simple XOR / Base64 encryption using Google User ID as key
function encrypt(text: string, key: string): string {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(result)));
}

function decrypt(cipherText: string, key: string): string {
  if (!cipherText) return '';
  try {
    const text = decodeURIComponent(escape(atob(cipherText)));
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    console.error('Decryption failed:', e);
    return '';
  }
}

export const syncProfileManager = {
  // Load local credentials into a SyncProfile object
  getLocalActiveProfile(type: SyncProfile['type']): SyncProfile {
    return {
      id: type,
      name: type.toUpperCase() + ' Active',
      type,
      webdavUrl: localStorage.getItem('todo_txt_webdav_url') || undefined,
      webdavUser: localStorage.getItem('todo_txt_webdav_user') || undefined,
      webdavPassword: localStorage.getItem('todo_txt_webdav_password') || undefined,
      webdavPath: localStorage.getItem('todo_txt_webdav_path') || undefined,
      gitPat: localStorage.getItem('todo_txt_git_pat') || undefined,
      gitRepo: localStorage.getItem('todo_txt_git_repo') || undefined,
      gitBranch: localStorage.getItem('todo_txt_git_branch') || undefined,
      gdriveTodoId: localStorage.getItem('todo_txt_gdrive_todo_id') || undefined,
      gdriveArchiveId: localStorage.getItem('todo_txt_gdrive_archive_id') || undefined,
    };
  },

  // Apply a profile's credentials to localStorage
  applyProfile(profile: SyncProfile) {
    if (profile.webdavUrl) localStorage.setItem('todo_txt_webdav_url', profile.webdavUrl);
    if (profile.webdavUser) localStorage.setItem('todo_txt_webdav_user', profile.webdavUser);
    if (profile.webdavPassword) localStorage.setItem('todo_txt_webdav_password', profile.webdavPassword);
    if (profile.webdavPath) localStorage.setItem('todo_txt_webdav_path', profile.webdavPath);
    if (profile.gitPat) localStorage.setItem('todo_txt_git_pat', profile.gitPat);
    if (profile.gitRepo) localStorage.setItem('todo_txt_git_repo', profile.gitRepo);
    if (profile.gitBranch) localStorage.setItem('todo_txt_git_branch', profile.gitBranch);
    if (profile.gdriveTodoId) localStorage.setItem('todo_txt_gdrive_todo_id', profile.gdriveTodoId);
    if (profile.gdriveArchiveId) localStorage.setItem('todo_txt_gdrive_archive_id', profile.gdriveArchiveId);
    
    localStorage.setItem('todo_txt_last_mode', profile.type);
  },

  // Fetch all profiles and the preferred profile ID from todo.config.json on GDrive
  async fetchProfilesAndConfig(gdriveUserKey: string): Promise<{ profiles: SyncProfile[]; preferredProfileId?: string }> {
    const token = getGoogleDriveToken();
    if (!token) return { profiles: [] };

    try {
      const configId = localStorage.getItem('todo_txt_gdrive_config_id');
      if (!configId) return { profiles: [] };

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${configId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return { profiles: [] };
      const configText = await res.text();
      const config = JSON.parse(configText || '{}');

      const profiles = config.sync_profiles || [];
      const preferredProfileId = config.preferred_profile_id;

      const decryptedProfiles = profiles.map((p: any) => ({
        ...p,
        webdavPassword: p.webdavPassword ? decrypt(p.webdavPassword, gdriveUserKey) : undefined,
        gitPat: p.gitPat ? decrypt(p.gitPat, gdriveUserKey) : undefined,
      }));

      return { profiles: decryptedProfiles, preferredProfileId };
    } catch (e) {
      console.error('Failed to load config from Google Drive:', e);
      return { profiles: [] };
    }
  },

  // Fetch only profiles (backwards compatibility for UI)
  async fetchProfilesFromCloud(gdriveUserKey: string): Promise<SyncProfile[]> {
    const { profiles } = await this.fetchProfilesAndConfig(gdriveUserKey);
    return profiles;
  },

  // Save profiles & preferred profile ID back to todo.config.json on GDrive
  async saveProfilesToCloud(profiles: SyncProfile[], gdriveUserKey: string, preferredProfileId?: string): Promise<boolean> {
    const token = getGoogleDriveToken();
    if (!token) return false;

    try {
      const configId = localStorage.getItem('todo_txt_gdrive_config_id');
      if (!configId) return false;

      // First fetch current config to avoid overwriting other config keys
      let config: any = {};
      const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${configId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (getRes.ok) {
        try { config = await getRes.json(); } catch (_) {}
      }

      // Encrypt sensitive credentials
      const encryptedProfiles = profiles.map(p => ({
        ...p,
        webdavPassword: p.webdavPassword ? encrypt(p.webdavPassword, gdriveUserKey) : undefined,
        gitPat: p.gitPat ? encrypt(p.gitPat, gdriveUserKey) : undefined,
      }));

      config.sync_profiles = encryptedProfiles;
      if (preferredProfileId !== undefined) {
        config.preferred_profile_id = preferredProfileId;
      }

      const saveRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${configId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      return saveRes.ok;
    } catch (e) {
      console.error('Failed to save profiles to Google Drive config:', e);
      return false;
    }
  },

  // Set the preferred profile in GDrive
  async setPreferredProfile(profileId: string, gdriveUserKey: string): Promise<boolean> {
    const profiles = await this.fetchProfilesFromCloud(gdriveUserKey);
    return await this.saveProfilesToCloud(profiles, gdriveUserKey, profileId);
  },

  // Auto-loads and applies the preferred profile if logged in
  async autoLoadPreferredProfile(gdriveUserKey: string): Promise<boolean> {
    try {
      const { profiles, preferredProfileId } = await this.fetchProfilesAndConfig(gdriveUserKey);
      if (preferredProfileId) {
        const preferred = profiles.find(p => p.id === preferredProfileId);
        if (preferred) {
          this.applyProfile(preferred);
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to auto-load preferred profile:', e);
    }
    return false;
  }
};
