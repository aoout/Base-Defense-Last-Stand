
import React from 'react';
import { WeaponType, HeroicUpgradeType, SystemIconType } from '../../types';

// --- GENERIC ICONS ---
export const Icons = {
    Save: () => <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8V3" />,
    Load: () => <path d="M12 3v12 M8 11l4 4 4-4 M2 17h20" />,
    Pin: () => <path d="M16 2v4h4l-5 5v5l-2 2-2-2V11l-5-5h4V2z" />,
    Unpin: () => <path d="M2 2l20 20 M16 2v4h4l-5 5v5l-2 2-2-2V11l-5-5h4V2z" />,
    Close: () => <path d="M18 6L6 18M6 6l12 12" />,
    Menu: () => <path d="M3 12h18M3 6h18M3 18h18" />,
    Back: () => <path d="M19 12H5M12 19l-7-7 7-7" />,
    Power: () => <path d="M18.36 6.64a9 9 0 1 1-12.73 0 M12 2v10" />,
    Ship: () => <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />,
    Galaxy: () => <g><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></g>,
    Radar: () => <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 4c4.41 0 8 3.59 8 8h-2c0-3.31-2.69-6-6-6V4z"/>,
    Chart: () => <path d="M3 3v18h18M7 14v4M12 10v8M17 6v12" />,
    Info: () => <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 15h-1v-5h1zm0-7h-1V9h1z" />,
    Settings: () => <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.91l-.36-2.54a.488.488 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.2-1.13.52-1.62.91l-2.39-.96a.488.488 0 0 0-.59.22L2.68 8.87a.488.488 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.488.488 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.91l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.2 1.13-.52 1.62-.91l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />,
    Gamepad: () => <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />,
    Lock: () => <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3 3.1-3s3.1 1.29 3.1 3v2z" />,
    Unlock: () => <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3 3.1-3s3.1 1.29 3.1 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />,
    Warning: () => <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />,
    Dashboard: () => <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />,
    
    // Updated Database (Stack)
    Database: () => <path d="M12 3c-4.42 0-8 1.79-8 4v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 14c-3.27 0-6-1.15-6-2v-2.1c1.23.99 3.49 1.6 6 1.6s4.77-.61 6-1.6V17c0 .85-2.73 2-6 2zm0-4c-3.27 0-6-1.15-6-2v-2.1c1.23.99 3.49 1.6 6 1.6s4.77-.61 6-1.6V13c0 .85-2.73 2-6 2zm0-4c-3.27 0-6-1.15-6-2V4.9c1.23.99 3.49 1.6 6 1.6s4.77-.61 6-1.6V9c0 .85-2.73 2-6 2z" />,
    
    // Updated Planet (Ringed)
    Planet: () => (
        <g>
            <g fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="6" strokeWidth="1.5" />
                <path d="M3 15c0-3 6-5 9-5s9 2 9 5" opacity="0.5" />
                <path d="M21 12c0 3-6 5-9 5s-9-2-9-5" strokeWidth="1.5" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" opacity="0.3" />
            </g>
            <g fill="currentColor" stroke="none">
                <rect x="16" y="4" width="4" height="1" />
                <rect x="4" y="19" width="4" height="1" />
            </g>
        </g>
    ),
    
    Logs: () => <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />,
    Hazard: () => <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z" />,
    StarMap: () => <path d="M12 2L2 22h20L12 2zm0 4l6 12H6l6-12z" />,
    Play: () => <path d="M8 5v14l11-7z" />,
    
    // New Icons for Actions
    DropPod: () => <path d="M12 2l-8 4v6l8 4 8-4V6l-8-4zm0 14v6m0-6l-8-4m8 4l8-4" />,
    Crane: () => <path d="M4 20h16M4 16h2v4H4v-4zm4-9l4-4 4 4v9H8V7zm4 0v4m-4 0h8" />,
    Analysis: () => <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,

    // Audio Disc Icon
    Disc: () => (
        <g stroke="currentColor" fill="none">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.5" stroke="none" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.5" strokeWidth="1" />
            <path d="M12 22a10 10 0 0 1-10-10" strokeOpacity="0.5" strokeWidth="1" />
            <circle cx="12" cy="12" r="6" strokeWidth="1" strokeOpacity="0.3" />
        </g>
    ),

    // Emergency Evac Icon
    Extraction: () => (
        <g stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </g>
    ),
};

export const WeaponIcon: React.FC<{ type: WeaponType, className?: string }> = ({ type, className }) => {
    let d = "";
    switch(type) {
        case WeaponType.AR: d="M4 12h16M15 12v3M7 12v2"; break;
        case WeaponType.SG: d="M4 11h16v2H4zM16 13v3"; break;
        case WeaponType.SR: d="M2 12h20M14 12v3M6 12v2M18 10v2"; break;
        case WeaponType.PISTOL: d="M6 10h8v4H6zM11 14v3"; break;
        case WeaponType.FLAMETHROWER: d="M4 11h12v2H4zM16 10v4M18 11h2"; break;
        case WeaponType.PULSE_RIFLE: d="M4 10h16v4H4zM10 10v4M16 10v4"; break;
        case WeaponType.GRENADE_LAUNCHER: d="M4 10h10v4H4zM14 9v6M16 11h4"; break;
    }
    return (<svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>)
};

export const SystemIcon: React.FC<{ type: SystemIconType, className?: string }> = ({ type, className }) => {
    let IconComp = Icons.Info;
    switch(type) {
        case 'DASHBOARD': IconComp = Icons.Dashboard; break;
        case 'DATABASE': IconComp = Icons.Database; break;
        case 'PLANET': IconComp = Icons.Planet; break;
        case 'LOGS': IconComp = Icons.Logs; break;
        case 'SETTINGS': IconComp = Icons.Settings; break;
        case 'SAVE': IconComp = Icons.Save; break;
        case 'CLOSE': IconComp = Icons.Close; break;
        case 'BACK': IconComp = Icons.Back; break;
        case 'LOCK': IconComp = Icons.Lock; break;
        case 'UNLOCK': IconComp = Icons.Unlock; break;
        case 'WARNING': IconComp = Icons.Warning; break;
    }
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
            <IconComp />
        </svg>
    );
};

export const HeroicIcons: Record<HeroicUpgradeType, React.ReactNode> = {
    [HeroicUpgradeType.MAX_HP]: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="none" fill="currentColor" fillOpacity="0.3"/>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    [HeroicUpgradeType.MAX_ARMOR]: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v8" strokeLinecap="round" />
            <path d="M8 12h8" strokeLinecap="round" />
        </svg>
    ),
    [HeroicUpgradeType.DAMAGE]: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    [HeroicUpgradeType.MOVE_SPEED]: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    [HeroicUpgradeType.RELOAD_SPEED]: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1 2.12-9.36L23 10" />
        </svg>
    ),
    [HeroicUpgradeType.TURRET_MASTERY]: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 2L8 6h3v10H8v4h8v-4h-3V6h3L12 2z" />
            <rect x="4" y="20" width="16" height="2" />
        </svg>
    )
};
