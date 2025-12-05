
import React from 'react';
import { SaveFile } from '../../types';
import { useLocale } from '../contexts/LocaleContext';

interface SaveSlotItemProps {
    save: SaveFile;
    onLoad: () => void;
    onDelete: () => void;
    onPin: () => void;
    onExport: () => void;
}

export const SaveSlotItem: React.FC<SaveSlotItemProps> = ({ save, onLoad, onDelete, onPin, onExport }) => {
    const { t } = useLocale();
    return (
        <div className={`p-4 border-l-2 flex flex-col gap-2 transition-all relative group ${save.isPinned ? 'bg-blue-900/20 border-blue-400' : 'bg-gray-900/40 border-gray-700 hover:border-blue-500/50'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <div className={`text-xs font-bold tracking-widest ${save.isPinned ? 'text-blue-300' : 'text-gray-400'}`}>
                        {save.label}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-0.5">
                        {new Date(save.timestamp).toLocaleString()}
                    </div>
                </div>
                {save.isPinned && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                )}
            </div>
            <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onLoad} className="flex-1 bg-blue-900/50 hover:bg-blue-600 text-blue-200 text-[10px] py-1 border border-blue-800 hover:border-blue-500">
                    {t('LOAD')}
                </button>
                <button onClick={onExport} title="Download Save" className="px-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] py-1 border border-gray-700">
                    ⬇
                </button>
                <button onClick={onPin} className="px-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] py-1 border border-gray-700">
                    {save.isPinned ? t('UNPIN') : t('PIN')}
                </button>
                <button onClick={onDelete} className="px-2 bg-red-900/20 hover:bg-red-900/50 text-red-500 text-[10px] py-1 border border-red-900/30">
                    ✕
                </button>
            </div>
        </div>
    )
};
