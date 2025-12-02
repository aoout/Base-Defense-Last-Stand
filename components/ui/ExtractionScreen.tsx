
import React from 'react';
import { GameState } from '../../types';

interface ExtractionScreenProps {
    onEvac: () => void;
}

export const ExtractionScreen: React.FC<ExtractionScreenProps> = ({ onEvac }) => {
    return (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center pointer-events-auto font-mono overflow-hidden">
             {/* Background Alarm Effect */}
             <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(220,38,38,0.1),rgba(220,38,38,0.1)_10px,transparent_10px,transparent_20px)] animate-[pulse_2s_infinite]"></div>
             <div className="absolute inset-0 bg-red-950/50 mix-blend-overlay"></div>
             
             {/* Central Terminal */}
             <div className="relative z-10 w-[800px] border-y-4 border-red-600 bg-black/90 p-12 shadow-[0_0_100px_rgba(220,38,38,0.5)] flex flex-col items-center text-center">
                 
                 {/* Top Warning Banner */}
                 <div className="w-full bg-red-600/20 border border-red-600 p-2 mb-8 flex justify-between items-center animate-pulse">
                     <span className="text-red-500 font-bold tracking-[0.2em] text-xs">CRITICAL SYSTEM FAILURE</span>
                     <span className="text-red-500 font-bold tracking-[0.2em] text-xs">SIGNAL LOST</span>
                 </div>

                 <h1 className="text-6xl font-black text-white tracking-tighter mb-2">BASE COMPROMISED</h1>
                 <h2 className="text-2xl text-red-500 font-bold tracking-widest mb-12">EMERGENCY PROTOCOL <span className="text-white">99-ALPHA</span> EXECUTED</h2>

                 <div className="w-full border-t border-b border-red-900/50 py-8 mb-8 space-y-4">
                     <div className="flex items-center gap-4 text-left">
                         <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                         <div className="text-slate-400 text-sm">Base structural integrity at 0%. Auto-destruct sequence initiated.</div>
                     </div>
                     <div className="flex items-center gap-4 text-left">
                         <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                         <div className="text-slate-400 text-sm">Commander Escape Pod launched. Trajectory: High Orbit.</div>
                     </div>
                     <div className="flex items-center gap-4 text-left">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                         <div className="text-green-400 text-sm font-bold">Colossus docking successful. Operative recovered.</div>
                     </div>
                 </div>

                 <p className="text-slate-500 text-xs mb-8 max-w-md">
                     The planetary beachhead has been lost. Resources gathered prior to destruction have been transmitted. The sector remains hostile. Re-group and select a new drop zone.
                 </p>

                 <button 
                    onClick={onEvac}
                    className="group relative px-12 py-4 bg-red-950 border border-red-600 hover:bg-red-900 transition-all overflow-hidden"
                 >
                     <div className="absolute inset-0 bg-red-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                     <div className="relative flex items-center gap-4">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                         </svg>
                         <span className="text-red-100 font-bold tracking-[0.2em] text-lg">RETURN TO BRIDGE</span>
                     </div>
                 </button>

             </div>

             {/* Footer Tech Text */}
             <div className="absolute bottom-8 text-red-900 font-mono text-xs tracking-[0.5em] animate-pulse">
                 NO SIGNAL // NO SIGNAL // NO SIGNAL
             </div>
        </div>
    );
};
