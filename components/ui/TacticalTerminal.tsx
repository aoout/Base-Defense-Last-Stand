import React, { useState, useEffect, useRef } from 'react';
import { select, scaleBand, scaleLinear, max, axisBottom, axisLeft } from 'd3';
import { GameState, GameSettings, EnemyType, BossType, GameMode } from '../../types';
import { BESTIARY_DB, ENEMY_STATS, BOSS_STATS } from '../../data/registry';
import { CloseButton } from './Shared';
import { drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper, drawBossRed, drawBossBlue, drawBossPurple, drawHiveMother } from '../../utils/renderers';
import { PlanetInfoPanel } from './PlanetInfoPanel';

const ToggleRow: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (<div className="flex items-center justify-between p-3 border border-green-900/50 hover:bg-green-900/20 cursor-pointer" onClick={onClick}><span>{label}</span><div className={`w-12 h-6 rounded-none border border-green-700 relative transition-colors ${active ? 'bg-green-900' : 'bg-black'}`}><div className={`absolute top-0.5 bottom-0.5 w-5 bg-green-500 transition-all ${active ? 'left-[calc(100%-22px)]' : 'left-0.5'}`}></div></div></div>);

const BestiaryPanel: React.FC<{ state: GameState, t: any }> = ({ state, t }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    
    const allEntities = [
        EnemyType.GRUNT, 
        EnemyType.RUSHER, 
        EnemyType.VIPER, 
        EnemyType.TANK, 
        EnemyType.KAMIKAZE, 
        BossType.RED_SUMMONER, 
        BossType.BLUE_BURST, 
        BossType.PURPLE_ACID,
        BossType.HIVE_MOTHER
    ];

    const isDiscovered = (id: string) => state.stats.encounteredEnemies.includes(id);

    useEffect(() => {
        const render = () => {
            if (selectedId && isDiscovered(selectedId) && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (!ctx) return;
                
                // Clear and Background
                ctx.clearRect(0, 0, 200, 200); 
                ctx.fillStyle = '#022c22'; 
                ctx.fillRect(0,0,200,200); 
                
                // Grid Effect
                ctx.strokeStyle = 'rgba(6, 95, 70, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for(let i=0; i<200; i+=20) { ctx.moveTo(i,0); ctx.lineTo(i,200); ctx.moveTo(0,i); ctx.lineTo(200,i); }
                ctx.stroke();
                
                ctx.strokeStyle = '#065f46'; 
                ctx.strokeRect(0,0,200,200);

                // Prepare Mock Entity
                let radius = 20;
                let color = '#fff';
                if (ENEMY_STATS[selectedId as EnemyType]) {
                    radius = ENEMY_STATS[selectedId as EnemyType].radius;
                    color = ENEMY_STATS[selectedId as EnemyType].color;
                } else if (BOSS_STATS[selectedId as BossType]) {
                    radius = BOSS_STATS[selectedId as BossType].radius;
                    color = BOSS_STATS[selectedId as BossType].color;
                }

                const isBoss = selectedId.includes('BOSS') || selectedId.includes('SUMMONER') || selectedId.includes('BURST') || selectedId.includes('ACID') || selectedId.includes('HIVE');

                const mockEntity: any = { 
                    x: 100, 
                    y: 100, 
                    radius: radius * 2, // Base scale
                    angle: 0, // Facing right by default in local space usually, but we rotate context
                    hp: 100, 
                    maxHp: 100, 
                    color: color, 
                    type: selectedId, 
                    bossType: selectedId, 
                    isBoss: isBoss,
                    armorValue: 90 // Visual for hive mother
                };
                
                const time = Date.now();
                
                ctx.save();
                // Move origin to center of canvas
                ctx.translate(100, 100);
                
                // Adjust scale to fit canvas nicely
                let scale = 1.5;
                if (isBoss) scale = 0.8;
                if (selectedId === BossType.HIVE_MOTHER) scale = 0.6;
                if (selectedId === BossType.RED_SUMMONER) scale = 0.7;
                
                ctx.scale(scale, scale);
                
                // Rotate to face UP (standard portrait orientation)
                // Most renderers draw facing RIGHT (0 rads) or are rotation agnostic but have a "head"
                // Let's rotate -90 deg to face up
                ctx.rotate(-Math.PI / 2);

                // The draw functions draw at (0,0) of the current context
                switch(selectedId) {
                    case EnemyType.GRUNT: drawGrunt(ctx, mockEntity, time); break;
                    case EnemyType.RUSHER: drawRusher(ctx, mockEntity, time); break;
                    case EnemyType.TANK: drawTank(ctx, mockEntity, time); break;
                    case EnemyType.KAMIKAZE: drawKamikaze(ctx, mockEntity, time); break;
                    case EnemyType.VIPER: drawViper(ctx, mockEntity, time); break;
                    case BossType.RED_SUMMONER: drawBossRed(ctx, mockEntity, time); break;
                    case BossType.BLUE_BURST: drawBossBlue(ctx, mockEntity, time); break;
                    case BossType.PURPLE_ACID: drawBossPurple(ctx, mockEntity, time); break;
                    case BossType.HIVE_MOTHER: drawHiveMother(ctx, mockEntity, time); break;
                }
                ctx.restore();
            }
            requestRef.current = requestAnimationFrame(render);
        };

        requestRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(requestRef.current);
    }, [selectedId, state.stats.encounteredEnemies]);

    return (
        <div className="flex h-full gap-4">
            <div className="w-1/3 border-r border-green-800 pr-2 overflow-y-auto">
                {allEntities.map(id => {
                    const discovered = isDiscovered(id);
                    const name = BESTIARY_DB[id]?.codeName || id;
                    return (<div key={id} onClick={() => setSelectedId(id)} className={`p-3 mb-2 cursor-pointer border transition-colors flex justify-between items-center ${selectedId === id ? 'bg-green-900 border-green-500 text-white' : 'bg-black/40 border-green-900/50 text-green-700 hover:bg-green-900/20'}`}><span className="font-bold text-xs tracking-widest">{discovered ? name : 'UNKNOWN SIGNAL'}</span>{!discovered && <span className="text-[10px] text-green-900 bg-green-900/20 px-1">LOCKED</span>}</div>);
                })}
            </div>
            <div className="flex-1 pl-2">
                {selectedId ? (
                    isDiscovered(selectedId) ? (
                        BESTIARY_DB[selectedId] ? (
                            <div className="h-full flex flex-col animate-fadeIn">
                                <div className="flex gap-4 mb-4">
                                    <div className="border border-green-700 w-[200px] h-[200px] bg-black relative flex-shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                        <canvas ref={canvasRef} width={200} height={200} className="w-full h-full" />
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
                                        <div className="absolute bottom-1 right-1 text-[10px] text-green-900 font-mono">FIG. A</div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="text-2xl font-black text-green-400 border-b border-green-800 pb-1">{BESTIARY_DB[selectedId].codeName}</div>
                                        <div className="text-xs text-green-600 font-bold tracking-widest">{t('CLASSIFICATION')}: {BESTIARY_DB[selectedId].classification}</div>
                                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-green-300">
                                            <div className="bg-green-900/30 p-2 border border-green-800">
                                                <span className="text-green-600 block text-[10px]">{t('DANGER_LEVEL')}</span>
                                                <div className="flex gap-0.5 mt-1">
                                                    {Array.from({length: 10}).map((_, i) => (
                                                        <div key={i} className={`h-1.5 w-full ${i < BESTIARY_DB[selectedId].danger ? 'bg-red-500' : 'bg-green-900'}`}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-green-900/10 p-4 border border-green-900/50 text-sm text-green-400 font-mono leading-relaxed overflow-y-auto">
                                    {BESTIARY_DB[selectedId].description}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-red-500 font-mono">DATABASE ERROR: ENTRY MISSING</div>
                        )
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-green-800 space-y-4">
                            <div className="text-6xl opacity-20">?</div>
                            <div className="text-xl font-bold">{t('BESTIARY_LOCKED')}</div>
                            <p className="text-xs max-w-xs text-center">{t('BESTIARY_HINT')}</p>
                        </div>
                    )
                ) : (
                    <div className="h-full flex items-center justify-center text-green-900 italic">SELECT A TARGET FROM THE INDEX</div>
                )}
            </div>
        </div>
    );
};

export const TacticalTerminal: React.FC<{ state: GameState, onToggleSetting: (k: keyof GameSettings) => void, onClose: () => void, onSave: () => void, t: any }> = ({ state, onToggleSetting, onClose, onSave, t }) => {
    const [activeTab, setActiveTab] = useState<'DATA' | 'CONFIG' | 'NOTES' | 'DATABASE' | 'PLANET' | 'MEMORY'>('DATA');
    const chartRef = useRef<SVGSVGElement>(null);
    const tabs = ['DATA', 'CONFIG', 'NOTES', 'DATABASE'];
    if (state.gameMode === GameMode.EXPLORATION) tabs.push('PLANET');
    tabs.push('MEMORY');

    useEffect(() => {
        if (activeTab === 'DATA' && chartRef.current) {
            const data = Object.entries(state.stats.killsByType).map(([type, count]) => ({ type, count }));
            const svg = select(chartRef.current);
            svg.selectAll("*").remove();
            const margin = { top: 20, right: 20, bottom: 40, left: 40 };
            const width = 400 - margin.left - margin.right;
            const height = 250 - margin.top - margin.bottom;
            const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
            const x = scaleBand().rangeRound([0, width]).padding(0.1).domain(data.map(d => d.type));
            const y = scaleLinear().rangeRound([height, 0]).domain([0, max(data, d => d.count) || 10]);
            g.append("g").attr("transform", `translate(0,${height})`).call(axisBottom(x)).selectAll("text").attr("fill", "#10B981").attr("font-family", "monospace").attr("font-size", "10px");
            g.append("g").call(axisLeft(y).ticks(5)).selectAll("text").attr("fill", "#10B981").attr("font-family", "monospace");
            g.selectAll("path, line").attr("stroke", "#065F46");
            g.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar").attr("x", d => x(d.type)!).attr("y", d => y(d.count)).attr("width", x.bandwidth()).attr("height", d => height - y(d.count)).attr("fill", "#10B981").attr("opacity", 0.8);
        }
    }, [activeTab, state.stats.killsByType]);

    const accuracy = state.stats.shotsFired > 0 ? ((state.stats.shotsHit / state.stats.shotsFired) * 100).toFixed(1) : "0.0";

    return (
        <div className="absolute inset-0 z-[100] bg-black pointer-events-auto font-mono text-green-500 flex items-center justify-center">
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
            <div className="w-[900px] h-[600px] border-2 border-green-800 bg-gray-900/90 relative shadow-[0_0_20px_rgba(16,185,129,0.2)] flex flex-col">
                <CloseButton onClick={onClose} colorClass="border-green-800 text-green-500 hover:text-white hover:bg-green-900/50" />
                <div className="border-b border-green-800 p-4 flex justify-between items-center bg-black/50">
                    <h1 className="text-2xl font-bold tracking-widest text-green-400">{t('PAUSE_TITLE')}</h1>
                    <div className="text-xs text-green-700 animate-pulse mr-8">{t('SYSTEM_PAUSED')}</div>
                </div>
                <div className="flex border-b border-green-800">
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 text-center transition-colors font-bold tracking-wider ${activeTab === tab ? 'bg-green-900/30 text-green-300 shadow-[inset_0_-2px_0_#34D399]' : 'text-green-800 hover:bg-green-900/10 hover:text-green-600'}`}>{t(`TAB_${tab}`)}</button>
                    ))}
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'DATA' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="border border-green-900 p-4 bg-black/40"> <div className="text-green-700 text-xs uppercase mb-1">{t('TOTAL_DAMAGE')}</div> <div className="text-2xl text-green-300">{state.stats.damageDealt.toLocaleString()}</div> </div>
                                <div className="border border-green-900 p-4 bg-black/40"> <div className="text-green-700 text-xs uppercase mb-1">{t('SHOTS_FIRED')}</div> <div className="text-2xl text-green-300">{state.stats.shotsFired.toLocaleString()}</div> </div>
                                <div className="border border-green-900 p-4 bg-black/40"> <div className="text-green-700 text-xs uppercase mb-1">{t('ACCURACY')}</div> <div className="text-2xl text-green-300">{accuracy}%</div> </div>
                            </div>
                            <div className="border border-green-900 p-4 bg-black/40 flex flex-col items-center">
                                <div className="w-full text-left text-green-700 text-xs uppercase mb-4">{t('KILLS_ANALYSIS')}</div>
                                <svg ref={chartRef} width={400} height={250}></svg>
                            </div>
                        </div>
                    )}
                    {activeTab === 'CONFIG' && (
                        <div className="space-y-4">
                            <h3 className="text-green-400 border-b border-green-900 pb-2 mb-4">{t('VISUAL_SETTINGS')}</h3>
                            <ToggleRow label={t('HUD_OVERLAY')} active={state.settings.showHUD} onClick={() => onToggleSetting('showHUD')} />
                            <ToggleRow label={t('GORE')} active={state.settings.showBlood} onClick={() => onToggleSetting('showBlood')} />
                            <ToggleRow label={t('DMG_TEXT')} active={state.settings.showDamageNumbers} onClick={() => onToggleSetting('showDamageNumbers')} />
                            <ToggleRow label={`${t('LANGUAGE')} : ${state.settings.language}`} active={state.settings.language === 'EN'} onClick={() => onToggleSetting('language')} />
                        </div>
                    )}
                    {activeTab === 'NOTES' && (
                        <div className="text-green-600 text-sm space-y-4 font-mono leading-relaxed">
                            <p className="text-green-400 font-bold">[MISSION BRIEFING]</p> <p>Defend the outpost against indigenous xenomorph lifeforms. The base integrity must be maintained at all costs.</p>
                            <p className="text-green-400 font-bold mt-6">[WEAPONRY]</p>
                            <ul className="list-disc pl-5 space-y-2"> <li><strong className="text-green-500">AR (Assault Rifle):</strong> Standard issue. Reliable damage and fire rate.</li> <li><strong className="text-green-500">SG (Shotgun):</strong> High impact at close quarters. Wide spread.</li> <li><strong className="text-green-500">SR (Sniper):</strong> Precision elimination. High recoil.</li> <li><strong className="text-green-500">PISTOL:</strong> Backup sidearm. Infinite ammo.</li> </ul>
                            <p className="text-green-400 font-bold mt-6">[TACTICS]</p> <p>Use [E] near base to access supply depot. Use [E] to construct automated defense turrets. Press [P] to access this terminal.</p>
                        </div>
                    )}
                    {activeTab === 'DATABASE' && <BestiaryPanel state={state} t={t} />}
                    {activeTab === 'PLANET' && state.currentPlanet && <PlanetInfoPanel planet={state.currentPlanet} t={t} onShowDetail={() => {}} />}
                    {activeTab === 'MEMORY' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-8">
                            <div className="border border-green-700 bg-green-900/10 p-8 max-w-lg text-center">
                                <h2 className="text-2xl font-bold mb-4">{t('MEMORY_STORAGE')}</h2>
                                <p className="text-sm text-green-600 mb-8">Current game state can be preserved in cryo-storage for future deployment. Overwrites oldest non-pinned memory if storage is full.</p>
                                <button onClick={onSave} className="px-8 py-4 bg-green-900 hover:bg-green-700 text-green-100 border border-green-500 font-bold tracking-widest text-xl transition-all">{t('SAVE_STATE')}</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-2 border-t border-green-900 text-center text-xs text-green-800">{t('RESUME_HINT')}</div>
            </div>
        </div>
    );
};