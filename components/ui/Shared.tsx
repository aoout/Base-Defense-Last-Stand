
import React from 'react';
import { WeaponType } from '../../types';

export const CloseButton: React.FC<{ onClick: () => void, colorClass?: string }> = ({ onClick, colorClass = "border-gray-500 text-gray-400 hover:text-white hover:bg-gray-700" }) => (
    <button onClick={onClick} className={`absolute top-4 right-4 p-2 rounded-lg border transition-all z-10 ${colorClass}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    </button>
);

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
}
