import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PickerContainerProps {
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  onCancel?: () => void;
  children: ReactNode;
  maxWidth?: 'md' | '3xl';
}

export const PickerContainer = ({ 
  title, 
  description, 
  icon, 
  onCancel, 
  children, 
  maxWidth = '3xl' 
}: PickerContainerProps) => {
  
  const maxWidthClass = maxWidth === 'md' ? 'max-w-md' : 'max-w-3xl';

  return (
    <div className={`${maxWidthClass} mx-auto w-full p-6 flex flex-col h-full overflow-hidden`}>
      <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          {icon && (
            <div className="w-12 h-12 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold mb-1 text-slate-900 dark:text-slate-100">{title}</h2>
            <div className="text-slate-500 dark:text-slate-400 text-sm">
              {description}
            </div>
          </div>
        </div>
        
        {onCancel && (
          <button 
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-lg transition-all shrink-0 cursor-pointer"
            title="Zurück zur Dienste-Auswahl"
          >
            <ArrowLeft size={16} />
            Abbrechen
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col w-full">
        {children}
      </div>
    </div>
  );
};
