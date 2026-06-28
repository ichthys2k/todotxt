import { useState, useEffect } from 'react';
import { syncProfileManager } from '../services/syncProfileManager';
import type { SyncProfile } from '../services/syncProfileManager';
import { Cloud, RefreshCw, ShieldAlert, Plus, Trash } from 'lucide-react';

interface ProfileSyncManagerUIProps {
  onProfileApplied: () => void;
}

export const ProfileSyncManagerUI = ({ onProfileApplied }: ProfileSyncManagerUIProps) => {
  const [profiles, setProfiles] = useState<SyncProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState<SyncProfile['type']>('webdav');

  const gdriveUserKey = localStorage.getItem('todo_txt_gdrive_user_id') || 'default-gdrive-key';

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const cloudProfiles = await syncProfileManager.fetchProfilesFromCloud(gdriveUserKey);
      setProfiles(cloudProfiles);
    } catch (err) {
      console.error(err);
      setError('Fehler beim Laden der Profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleCreateProfileFromCurrent = async () => {
    if (!newProfileName.trim()) return;

    try {
      setSaving(true);
      const activeProfile = syncProfileManager.getLocalActiveProfile(newProfileType);
      
      const newProfile: SyncProfile = {
        ...activeProfile,
        id: Date.now().toString(),
        name: newProfileName.trim(),
        type: newProfileType
      };

      const updated = [...profiles, newProfile];
      const success = await syncProfileManager.saveProfilesToCloud(updated, gdriveUserKey);
      
      if (success) {
        setProfiles(updated);
        setNewProfileName('');
      } else {
        throw new Error('Speichern auf Google Drive fehlgeschlagen');
      }
    } catch (err) {
      console.error(err);
      setError('Fehler beim Erstellen des Profils.');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyProfile = async (profile: SyncProfile) => {
    syncProfileManager.applyProfile(profile);
    try {
      await syncProfileManager.setPreferredProfile(profile.id, gdriveUserKey);
    } catch (e) {
      console.error('Failed to set preferred profile:', e);
    }
    onProfileApplied();
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      setSaving(true);
      const updated = profiles.filter(p => p.id !== profileId);
      const success = await syncProfileManager.saveProfilesToCloud(updated, gdriveUserKey);
      if (success) {
        setProfiles(updated);
      } else {
        throw new Error('Löschen fehlgeschlagen');
      }
    } catch (err) {
      console.error(err);
      setError('Fehler beim Löschen des Profils.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 mt-2 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
          <Cloud size={16} className="text-indigo-500" /> Profil-Synchronisierung
        </span>
        <button
          onClick={loadProfiles}
          disabled={loading}
          className="p-1.5 text-slate-500 hover:text-indigo-650 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Profile aktualisieren"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2 text-xs">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <RefreshCw size={24} className="animate-spin text-slate-400" />
        </div>
      ) : profiles.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">Keine synchronisierten Profile auf Google Drive gefunden.</p>
      ) : (
        <div className="space-y-2">
          {profiles.map(profile => (
            <div 
              key={profile.id}
              className="flex items-center justify-between bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-200 dark:hover:border-indigo-950/50 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {profile.name}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Typ: {profile.type.toUpperCase()}
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleApplyProfile(profile)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Aktivieren
                </button>
                <button
                  onClick={() => handleDeleteProfile(profile.id)}
                  disabled={saving}
                  className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Profil löschen"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add profile form */}
      <div className="p-3 bg-slate-100/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-3">
        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">Aktuelle Zugangsdaten als Profil sichern</div>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Profilname (z. B. Arbeit GitHub)"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            disabled={saving}
            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <select
            value={newProfileType}
            onChange={(e) => setNewProfileType(e.target.value as any)}
            disabled={saving}
            className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="webdav">WebDAV</option>
            <option value="git">GitHub</option>
            <option value="onedrive">OneDrive</option>
            <option value="gdrive">Google Drive</option>
          </select>
        </div>

        <button
          onClick={handleCreateProfileFromCurrent}
          disabled={saving || !newProfileName.trim()}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
        >
          <Plus size={14} />
          <span>Profil erstellen</span>
        </button>
      </div>
    </div>
  );
};
