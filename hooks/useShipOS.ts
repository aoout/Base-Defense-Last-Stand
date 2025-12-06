
import { useState, useEffect } from 'react';

export interface WindowState {
    id: string;
    title: string;
    content: React.ReactNode;
    isOpen: boolean;
    zIndex: number;
    className?: string;
}

export const useShipOS = (t: (key: string) => string) => {
    const [booting, setBooting] = useState(true);
    const [bootLog, setBootLog] = useState<string[]>([]);
    const [windows, setWindows] = useState<WindowState[]>([]);
    const [time, setTime] = useState("");

    // Boot Sequence
    useEffect(() => {
        const logs = [
            t('OS_BOOT'),
            t('OS_CHECK_MEM'),
            t('OS_MOUNT_FS'),
            t('OS_EST_LINK'),
            t('OS_LOAD_MODS'),
            t('OS_AUTH'),
            t('OS_ACCESS')
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            if (i < logs.length) {
                setBootLog(prev => [...prev, logs[i]]);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => setBooting(false), 500);
            }
        }, 150);

        return () => clearInterval(interval);
    }, [t]);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => {
            const d = new Date();
            setTime(d.toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const openWindow = (id: string, title: string, content: React.ReactNode, className?: string) => {
        setWindows(prev => {
            const maxZ = prev.reduce((max, w) => Math.max(max, w.zIndex), 10);
            const newZ = maxZ + 1;
            
            const existing = prev.find(w => w.id === id);
            if (existing) {
                return prev.map(w => w.id === id ? { ...w, isOpen: true, zIndex: newZ, className } : w);
            }
            return [...prev, { id, title, content, isOpen: true, zIndex: newZ, className }];
        });
    };

    const closeWindow = (id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: false } : w));
    };

    const focusWindow = (id: string) => {
        setWindows(prev => {
            const maxZ = prev.reduce((max, w) => Math.max(max, w.zIndex), 10);
            const target = prev.find(w => w.id === id);
            if (target && target.zIndex === maxZ) return prev;
            const newZ = maxZ + 1;
            return prev.map(w => w.id === id ? { ...w, zIndex: newZ } : w);
        });
    };

    return {
        booting,
        bootLog,
        windows,
        time,
        openWindow,
        closeWindow,
        focusWindow
    };
};
