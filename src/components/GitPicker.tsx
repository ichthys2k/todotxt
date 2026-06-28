import { useState } from 'react';
import { Key, GitBranch, RefreshCw } from 'lucide-react';
import { testGitConnection } from '../services/providers/GitSyncProvider';
import { PickerContainer } from './PickerContainer';
import { getGitCredentials, setGitCredentials } from '../services/storageService';

const githubIcon = (
  <svg className="w-6 h-6 text-slate-800 dark:text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.24c3.18-.35 6.5-1.5 6.5-7.16 0-1.6-.5-2.9-1.3-3.9.1-.3.6-1.9-.1-4 0 0-1.1-.4-3.5 1.3a12.1 12.1 0 0 0-6.4 0C6.9 2.5 5.8 2.9 5.8 2.9c-.7 2.1-.2 3.7-.1 4-.8 1-1.3 2.3-1.3 3.9 0 5.6 3.3 6.8 6.5 7.16a4.8 4.8 0 0 0-1 3.24V22" />
  </svg>
);

interface GitPickerProps {
  onFileSelected: () => void;
  onCancel?: () => void;
}

export const GitPicker = ({ onFileSelected, onCancel }: GitPickerProps) => {
  const credentials = getGitCredentials();
  
  const [pat, setPat] = useState(credentials.pat || '');
  const [repo, setRepo] = useState(credentials.repo || '');
  const [branch, setBranch] = useState(credentials.branch || 'main');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pat.trim() || !repo.trim() || !branch.trim()) {
      setError('Bitte alle Felder ausfüllen.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanRepo = repo.replace('https://github.com/', '').trim();
      await testGitConnection(pat.trim(), cleanRepo, branch.trim());
      setGitCredentials(pat.trim(), cleanRepo, branch.trim());
      onFileSelected();
    } catch (err: any) {
      setError(err.message || 'Verbindung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PickerContainer
      title="Mit GitHub verbinden"
      description="Speichere deine Aufgaben direkt in einem GitHub Repository."
      icon={githubIcon}
      onCancel={onCancel}
      maxWidth="md"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mt-4">
        <form onSubmit={handleConnect} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Personal Access Token (PAT)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="text-slate-400" size={18} />
              </div>
              <input
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder="ghp_..."
                className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Benötigt die "repo" Berechtigung (Classic) oder "Contents: Read/Write" (Fine-grained).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Repository
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GitBranch className="text-slate-400" size={18} />
              </div>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="benutzername/repository"
                className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Branch
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GitBranch className="text-slate-400" size={18} />
              </div>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500"
                required
              />
            </div>
          </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-6 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Verbinden'}
            </button>
        </form>
      </div>
    </PickerContainer>
  );
};
