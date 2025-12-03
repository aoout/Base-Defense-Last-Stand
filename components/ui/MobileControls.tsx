import React, { useRef, useEffect, useState } from 'react';
import { WeaponType } from '../../types';

interface MobileControlsProps {
    onJoystickMove: (side: 'LEFT' | 'RIGHT', x: number, y: number) => void;
    onButtonPress: (action: string) => void;
    currentWeaponIndex: number;
    loadout: WeaponType[];
}

const Joystick: React.FC<{ 
    side: 'LEFT' | 'RIGHT', 
    onMove: (x: number, y: number) => void 
}> = ({ side, onMove }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stickRef = useRef<HTMLDivElement>(null);
    const touchId = useRef<number | null>(null);
    
    // Config
    const radius = 50; // Max stick travel

    // Helper to update position without React re-renders
    const updateStickVisual = (x: number, y: number) => {
        if (stickRef.current) {
            stickRef.current.style.transform = `translate(${x}px, ${y}px)`;
        }
    };

    const handleStart = (e: React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        
        // If already tracking a touch, ignore new ones
        if (touchId.current !== null) return;

        const touch = e.changedTouches[0];
        touchId.current = touch.identifier;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        updateMove(touch, rect);
    };

    const handleMove = (e: React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        if (touchId.current === null) return;

        // Find our touch
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId.current) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    updateMove(e.changedTouches[i], rect);
                }
                break;
            }
        }
    };

    const updateMove = (touch: React.Touch, rect: DOMRect) => {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Normalize output -1 to 1
        let nx = dx / radius;
        let ny = dy / radius;

        // Clamp stick visual
        if (dist > radius) {
            dx = (dx / dist) * radius;
            dy = (dy / dist) * radius;
        }

        // Clamp output magnitude to 1.0
        const mag = Math.sqrt(nx*nx + ny*ny);
        if (mag > 1) {
            nx /= mag;
            ny /= mag;
        }

        updateStickVisual(dx, dy);
        onMove(nx, ny);
    }

    const handleEnd = (e: React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();
        if (touchId.current === null) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId.current) {
                touchId.current = null;
                updateStickVisual(0, 0);
                onMove(0, 0);
                break;
            }
        }
    };

    return (
        <div 
            ref={containerRef}
            className={`absolute bottom-8 w-32 h-32 rounded-full border-2 border-slate-600 bg-slate-900/50 backdrop-blur-sm touch-none flex items-center justify-center ${side === 'LEFT' ? 'left-8' : 'right-8'}`}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
        >
            {/* Stick */}
            <div 
                ref={stickRef}
                className={`w-12 h-12 rounded-full shadow-lg pointer-events-none will-change-transform ${side === 'LEFT' ? 'bg-cyan-500/80 shadow-[0_0_10px_cyan]' : 'bg-red-500/80 shadow-[0_0_10px_red]'}`}
                style={{ transform: `translate(0px, 0px)` }}
            ></div>
        </div>
    );
};

const ActionButton: React.FC<{ label: string, onClick: () => void, className?: string }> = ({ label, onClick, className }) => (
    <button 
        onTouchStart={(e) => { 
            if (e.cancelable) e.preventDefault(); 
            e.stopPropagation(); 
            onClick(); 
        }}
        className={`w-14 h-14 rounded-full border-2 bg-slate-800/80 text-white font-bold text-xs flex items-center justify-center active:scale-95 active:bg-slate-700 shadow-lg touch-none select-none ${className}`}
    >
        {label}
    </button>
);

export const MobileControls: React.FC<MobileControlsProps> = ({ onJoystickMove, onButtonPress, currentWeaponIndex, loadout }) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-[800] touch-none select-none">
            {/* Left Joystick - Movement */}
            <div className="absolute bottom-0 left-0 w-1/3 h-1/2 pointer-events-auto touch-none">
                <Joystick side="LEFT" onMove={(x, y) => onJoystickMove('LEFT', x, y)} />
            </div>

            {/* Right Joystick - Aim/Fire */}
            <div className="absolute bottom-0 right-0 w-1/3 h-1/2 pointer-events-auto touch-none">
                <Joystick side="RIGHT" onMove={(x, y) => onJoystickMove('RIGHT', x, y)} />
                
                {/* Action Arc */}
                <div className="absolute bottom-40 right-4 flex flex-col gap-4">
                    <ActionButton 
                        label="R" 
                        onClick={() => onButtonPress('RELOAD')} 
                        className="border-yellow-500 text-yellow-400" 
                    />
                    <ActionButton 
                        label="G" 
                        onClick={() => onButtonPress('GRENADE')} 
                        className="border-orange-500 text-orange-400" 
                    />
                    <ActionButton 
                        label="E" 
                        onClick={() => onButtonPress('INTERACT')} 
                        className="border-green-500 text-green-400 w-16 h-16 text-lg" 
                    />
                </div>

                {/* Weapon Swap / Scope */}
                <div className="absolute bottom-40 right-24 flex gap-4">
                     <ActionButton 
                        label="⟳" 
                        onClick={() => onButtonPress('SWAP')} 
                        className="border-cyan-500 text-cyan-400" 
                    />
                    <ActionButton 
                        label="⌖" 
                        onClick={() => onButtonPress('SCOPE')} 
                        className="border-blue-500 text-blue-400" 
                    />
                </div>
            </div>

            {/* Top Right - Tactical Menu */}
            <div className="absolute top-4 right-20 pointer-events-auto touch-none">
                <ActionButton 
                    label="TAB" 
                    onClick={() => onButtonPress('TACTICAL')} 
                    className="w-10 h-10 border-slate-500 text-slate-400" 
                />
            </div>
        </div>
    );
};