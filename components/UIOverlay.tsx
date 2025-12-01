




import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GameState, WeaponType, EnemyType, GameSettings, AllyOrder, Player, TurretType, SpecialEventType, Enemy, BossType, AppMode, GameMode, Planet, SaveFile, DefenseUpgradeType, ModuleType, WeaponModule, AtmosphereGas } from '../types';
import { PLAYER_STATS, SHOP_PRICES, WEAPONS, TURRET_COSTS, INVENTORY_SIZE, TURRET_STATS, TRANSLATIONS, BESTIARY_DB, ENEMY_STATS, BOSS_STATS, BIOME_STYLES, DEFENSE_UPGRADE_INFO, MODULE_STATS } from '../constants';
import { drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper, drawBossRed, drawBossBlue, drawBossPurple, drawPlanetSprite } from './GameCanvas';

interface UIOverlayProps {
  state: GameState;
  onPurchase: (item: string) => void;
  onCloseShop: () => void;
  onCloseInventory: () => void;
  onCloseTacticalMenu: () => void;
  onClosePause: () => void;
  onRestart: () => void;
  onToggleSetting: (key: keyof GameSettings) => void;
  onIssueOrder: (order: AllyOrder) => void;
  onSwapItems: (loadoutIdx: number, inventoryIdx: number) => void;
  onConfirmUpgrade: (type: TurretType) => void;
  // New handlers
  onStartSurvival: () => void;
  onStartExploration: () => void;
  onDeployPlanet: (id: string) => void;
  onReturnToMap: () => void;
  onDeselectPlanet: () => void;
  
  // Spaceship
  onOpenSpaceship: () => void;
  onCloseSpaceship: () => void;

  // Save/Load
  onSaveGame: () => void;
  onLoadGame: (id: string) => void;
  onDeleteSave: (id: string) => void;
  onTogglePin: (id: string) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
    state, 
    onPurchase, 
    onCloseShop, 
    onCloseInventory,
    onCloseTacticalMenu,
    onClosePause,
    onRestart, 
    onToggleSetting, 
    onIssueOrder, 
    onSwapItems, 
    onConfirmUpgrade,
    onStartSurvival,
    onStartExploration,
    onDeployPlanet,
    onReturnToMap,
    onDeselectPlanet,
    onOpenSpaceship,
    onCloseSpaceship,
    onSaveGame,
    onLoadGame,
    onDeleteSave,
    onTogglePin
}) => {
  const p = state.player;
  const currentWeaponType = p.loadout[p.currentWeaponIndex];
  const currentWep = p.weapons[currentWeaponType];
  const wepStats = WEAPONS[currentWeaponType];
  const t = (key: keyof typeof TRANSLATIONS.EN) => TRANSLATIONS[state.settings.language][key];

  const [viewingAtmosphere, setViewingAtmosphere] = useState(false);

  // Reset atmosphere view when planet selection changes or mode changes
  useEffect(() => {
      setViewingAtmosphere(false);
  }, [state.selectedPlanetId, state.appMode]);

  // --- MODE SPECIFIC UIs ---

  if (state.appMode === AppMode.START_MENU) {
      return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              {/* Floating Cryo Storage (Left) */}
              <div className="absolute top-12 bottom-12 left-12 w-96 flex flex-col justify-center">
                  <div className="mb-6 border-b border-blue-500/30 pb-2">
                       <h2 className="text-blue-400 font-mono text-sm tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(59,130,246,0.8)] animate-pulse">{t('EXTRACTABLE_MEMORIES')}</h2>
                  </div>
                  <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-4 scrollbar-thin scrollbar-thumb-blue-900/50 scrollbar-track-transparent">
                      {state.saveSlots.length === 0 && (
                          <div className="text-blue-500/30 italic text-xs py-10 border border-blue-900/20 bg-blue-900/5 p-4 text-center tracking-widest">
                              NO DATA ARCHIVED
                          </div>
                      )}
                      {state.saveSlots.map(save => (
                          <SaveSlotItem 
                            key={save.id} 
                            save={save} 
                            onLoad={() => onLoadGame(save.id)}
                            onDelete={() => onDeleteSave(save.id)}
                            onPin={() => onTogglePin(save.id)}
                            t={t}
                          />
                      ))}
                  </div>
              </div>

              {/* Main Menu (Right Side) */}
              <div className="absolute right-24 flex flex-col items-end space-y-12">
                  <div className="text-right">
                      <h1 className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                          BASE<br/><span className="text-blue-500 text-9xl">DEFENSE</span>
                      </h1>
                      <div className="flex items-center justify-end gap-2 mt-2">
                          <div className="h-px w-24 bg-blue-500"></div>
                          <p className="text-blue-300 font-mono tracking-[0.4em] text-sm">TACTICAL SURVIVAL SIMULATION</p>
                      </div>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                      <button onClick={onStartSurvival} className="group relative w-[420px] h-24 bg-gray-900/40 border-l-4 border-white/20 hover:border-blue-500 transition-all flex items-center justify-between px-8 overflow-hidden backdrop-blur-sm">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                          <span className="relative z-10 text-4xl font-black text-white tracking-widest group-hover:text-blue-100 transition-colors">SURVIVAL</span>
                          <span className="relative z-10 text-xs text-gray-500 group-hover:text-blue-300 font-mono uppercase tracking-wider">Endless Waves</span>
                      </button>

                      <button onClick={onStartExploration} className="group relative w-[420px] h-24 bg-gray-900/40 border-l-4 border-white/20 hover:border-purple-500 transition-all flex items-center justify-between px-8 overflow-hidden backdrop-blur-sm">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                          <span className="relative z-10 text-4xl font-black text-white tracking-widest group-hover:text-purple-100 transition-colors">EXPLORE</span>
                          <span className="relative z-10 text-xs text-gray-500 group-hover:text-purple-300 font-mono uppercase tracking-wider">Campaign Mode</span>
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  if (state.appMode === AppMode.SPACESHIP_VIEW) {
      return (
          <SpaceshipView state={state} onClose={onCloseSpaceship} />
      )
  }

  if (state.appMode === AppMode.EXPLORATION_MAP) {
      const planet = state.planets.find(p => p.id === state.selectedPlanetId);
      return (
          <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-8 left-8">
                  <h1 className="text-4xl font-bold text-white tracking-widest">SECTOR MAP</h1>
                  <p className="text-blue-400 font-mono text-sm">SELECT DESTINATION</p>
              </div>

              <div className="absolute top-8 right-8 pointer-events-auto flex gap-4">
                  <button 
                    onClick={onSaveGame}
                    className="w-12 h-12 bg-gray-900/80 border border-blue-500/50 hover:bg-blue-900/50 text-blue-400 flex items-center justify-center rounded transition-all"
                    title={t('SAVE_STATE')}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                  </button>
              </div>

              {/* Spaceship Button (Bottom Left) */}
              <div className="absolute bottom-8 left-8 pointer-events-auto">
                  <button 
                    onClick={onOpenSpaceship}
                    className="group relative flex items-center gap-4 pl-4 pr-8 py-4 bg-slate-900/90 border border-cyan-500/50 hover:border-cyan-400 hover:bg-slate-800 transition-all overflow-hidden"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)' }}
                  >
                      {/* Tech decorative lines */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
                      <div className="absolute right-0 top-0 w-4 h-4 border-t border-r border-cyan-500/50"></div>
                      
                      {/* Icon Container */}
                      <div className="relative w-12 h-12 bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8 text-cyan-400 group-hover:text-white transition-colors">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L2 22h20L12 2zm0 4v8M12 18v2" />
                          </svg>
                          {/* Animated scan line inside icon */}
                          <div className="absolute inset-0 bg-cyan-400/10 animate-[scan_2s_linear_infinite] pointer-events-none"></div>
                      </div>

                      <div className="flex flex-col">
                          <div className="text-cyan-400 text-[10px] font-mono tracking-[0.2em] leading-none mb-1 group-hover:text-cyan-200">PROJECT</div>
                          <div className="text-white text-xl font-black tracking-widest leading-none group-hover:text-cyan-100">VANGUARD</div>
                      </div>
                  </button>
              </div>

              {/* Full Screen Atmosphere Modal */}
              {viewingAtmosphere && planet && (
                  <AtmosphereAnalysisModal planet={planet} onClose={() => setViewingAtmosphere(false)} />
              )}

              {planet && (
                  <div className="absolute top-1/2 right-12 -translate-y-1/2 w-96 bg-gray-900/90 border border-blue-500 p-8 pointer-events-auto backdrop-blur-md">
                      <CloseButton onClick={onDeselectPlanet} colorClass="border-blue-500 text-blue-500 hover:text-white hover:bg-blue-900/50" />
                      <PlanetInfoPanel 
                        planet={planet} 
                        t={t} 
                        onShowDetail={() => setViewingAtmosphere(true)}
                      />
                      <button 
                        onClick={() => onDeployPlanet(planet.id)}
                        className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-[0.2em] transition-all"
                      >
                          INITIATE DROP
                      </button>
                  </div>
              )}
          </div>
      )
  }

  if (state.isGameOver) {
      return <MissionFailedScreen state={state} onRestart={onRestart} />;
  }

  if (state.missionComplete) {
      return (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center pointer-events-auto font-mono text-white">
             <div className="border-4 border-green-500 p-12 max-w-2xl w-full bg-gray-900 relative shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                 <h1 className="text-6xl font-black text-green-500 mb-2 tracking-tighter text-center">MISSION COMPLETE</h1>
                 <p className="text-center text-green-300 tracking-[0.3em] mb-8">SECTOR SECURED</p>

                 <div className="grid grid-cols-2 gap-8 mb-8 text-center">
                     <div className="bg-black/40 p-4 border border-green-900">
                         <div className="text-gray-500 text-xs">SCRAPS COLLECTED</div>
                         <div className="text-3xl font-bold text-yellow-400">{Math.floor(state.player.score)}</div>
                     </div>
                     <div className="bg-black/40 p-4 border border-green-900">
                         <div className="text-gray-500 text-xs">TOTAL KILLS</div>
                         <div className="text-3xl font-bold text-red-400">{(Object.values(state.stats.killsByType) as number[]).reduce((a, b) => a + b, 0)}</div>
                     </div>
                 </div>

                 <button 
                    onClick={onReturnToMap}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-black font-bold text-xl tracking-widest uppercase transition-all"
                 >
                     Return to Orbit
                 </button>
             </div>
        </div>
      );
  }

  // --- GAMEPLAY HUD ---

  if (state.activeTurretId !== undefined) {
      return <TurretUpgradeUI state={state} onConfirmUpgrade={onConfirmUpgrade} />;
  }

  if (state.isTacticalMenuOpen) {
      return <TacticalCallInterface state={state} onIssueOrder={onIssueOrder} onClose={onCloseTacticalMenu} t={t} />;
  }

  if (state.isInventoryOpen) {
      return <TacticalBackpack state={state} onSwapItems={onSwapItems} onClose={onCloseInventory} t={t} />;
  }

  if (state.isPaused) {
      return <TacticalTerminal state={state} onToggleSetting={onToggleSetting} onClose={onClosePause} onSave={onSaveGame} t={t} />;
  }

  const secondsLeft = Math.ceil(state.waveTimeRemaining / 1000);
  const formattedTime = `${Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`;

  return (
    <div className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden">
      
      {/* --- SPECIAL EVENT WARNING BANNER --- */}
      {state.activeSpecialEvent !== SpecialEventType.NONE && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full flex justify-center">
              <div className="bg-red-900/80 border-y-2 border-red-500 w-full py-2 flex justify-center items-center shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">
                  <div className="text-white font-black text-2xl tracking-[0.3em] uppercase drop-shadow-md">
                      {state.activeSpecialEvent === SpecialEventType.FRENZY && "WARNING: SWARM FRENZY DETECTED"}
                      {state.activeSpecialEvent === SpecialEventType.BOSS && "WARNING: HIGH CLASS BIO-SIGNATURE"}
                  </div>
              </div>
          </div>
      )}

      {/* --- HUD Elements --- */}
      {state.settings.showHUD && (
        <>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="bg-black/60 px-8 py-2 rounded-full border border-gray-600 backdrop-blur-sm shadow-lg flex flex-col items-center">
                    <div className="flex items-center">
                        <span className="text-gray-400 text-xs font-bold tracking-[0.2em] mr-3">WAVE</span>
                        <span className="text-white text-3xl font-black italic">{state.wave}</span>
                        {state.gameMode === GameMode.EXPLORATION && state.currentPlanet && (
                            <span className="text-gray-500 text-sm ml-2 font-mono">/ {state.currentPlanet.totalWaves}</span>
                        )}
                    </div>
                    <div className="text-yellow-400 font-mono text-xl font-bold tracking-widest leading-none mt-1">
                        {formattedTime}
                    </div>
                </div>
            </div>

            <div className="absolute top-6 right-6">
                <div className="bg-black/60 px-6 py-3 rounded-xl border border-yellow-600/40 backdrop-blur-sm flex items-center gap-4 shadow-lg">
                    <div className="flex flex-col items-end">
                        <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest">{t('SCRAPS')}</span>
                        <span className="text-3xl font-mono font-bold text-white leading-none">{Math.floor(p.score)}</span>
                    </div>
                    <div className="text-yellow-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 left-6 w-72">
                <div className="bg-black/70 p-4 rounded-xl border border-blue-900/50 backdrop-blur-sm shadow-xl">
                    <div className="flex justify-between items-baseline mb-2">
                        <span className="text-blue-400 text-xs font-bold tracking-widest">BASE INTEGRITY</span>
                        <span className="text-white font-mono text-sm">{Math.ceil(state.base.hp)} / {state.base.maxHp}</span>
                    </div>
                    <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
                        <div 
                            className={`h-full transition-all duration-300 ${state.base.hp < state.base.maxHp * 0.3 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`} 
                            style={{ width: `${Math.max(0, state.base.hp / state.base.maxHp * 100)}%` }}
                        ></div>
                    </div>
                </div>
                <div className="mt-2 text-gray-500 text-xs font-mono">
                    {t('CLOSE_BACKPACK').replace("CLOSE", "OPEN")}
                </div>
            </div>

            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 scale-50 origin-bottom-right">
                <div className="bg-black/80 p-6 rounded-2xl border border-gray-700 backdrop-blur-md text-right min-w-[260px] shadow-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest bg-gray-900 px-2 py-1 rounded">
                            {wepStats.name}
                        </div>
                        {currentWep.reloading && (
                            <span className="text-yellow-400 text-xs font-bold animate-pulse">RELOADING</span>
                        )}
                    </div>
                    <div className="flex items-baseline justify-end gap-1 mb-4">
                        <span className={`text-6xl font-black tracking-tighter leading-none ${currentWep.ammoInMag === 0 ? 'text-red-500' : 'text-white'}`}>
                            {currentWep.ammoInMag}
                        </span>
                        <div className="flex flex-col items-start ml-2">
                            <span className="text-xs text-gray-500 font-bold uppercase">RESERVE</span>
                            <span className="text-xl text-gray-400 font-mono font-medium leading-none">
                                {currentWep.ammoReserve === Infinity ? '∞' : currentWep.ammoReserve}
                            </span>
                        </div>
                    </div>
                    
                    <div className="h-px bg-gradient-to-l from-gray-600 to-transparent w-full my-3"></div>

                    <div className="flex items-center justify-end gap-3 text-white">
                        <span className="text-[10px] text-gray-500 font-bold tracking-wider">{t('GRENADE')} [G]</span>
                        <div className="flex gap-1">
                            {Array.from({length: PLAYER_STATS.maxGrenades}).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-3 h-5 rounded-sm border border-black/50 ${i < p.grenades ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]' : 'bg-gray-800'}`}
                                />
                            ))}
                        </div>
                        <span className="font-mono text-xl font-bold ml-1 text-orange-400">{p.grenades}</span>
                    </div>
                </div>

                <div className="flex gap-2 bg-black/40 p-2 rounded-xl backdrop-blur-sm border border-gray-800">
                    {p.loadout.map((wType, idx) => (
                        <div 
                            key={idx}
                            className={`
                                w-12 h-12 flex flex-col items-center justify-center rounded-lg border transition-all duration-200
                                ${p.currentWeaponIndex === idx 
                                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg -translate-y-1' 
                                    : 'bg-gray-800/80 border-gray-700 text-gray-500'}
                            `}
                        >
                            <span className="text-[10px] opacity-70 leading-none mb-0.5">{idx + 1}</span>
                            <WeaponIcon type={wType} className="w-5 h-5 fill-current" />
                        </div>
                    ))}
                </div>
            </div>
        </>
      )}

      {/* Shop Modal */}
      {state.isShopOpen && (
        <ShopModal state={state} onPurchase={onPurchase} onClose={onCloseShop} t={t} />
      )}

      {/* Interact Prompt */}
      {!state.isPaused && <InteractPrompt state={state} />}
    </div>
  );
};

// ... (SpaceshipView, ShopModal, WeaponAssemblyModal, TacticalBackpack, MissionFailedScreen, StatRow, TacticalCallInterface, TacticalTerminal)

const PlanetInfoPanel: React.FC<{ planet: Planet, t: any, onShowDetail: () => void }> = ({ planet, t, onShowDetail }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    // Removed local state

    useEffect(() => {
        const renderPreview = () => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            const w = canvasRef.current.width; const h = canvasRef.current.height; const time = Date.now();
            ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, w, h);
            drawPlanetSprite(ctx, planet, w/2, h/2, 80, time, false);
            requestRef.current = requestAnimationFrame(renderPreview);
        };
        requestRef.current = requestAnimationFrame(renderPreview);
        return () => cancelAnimationFrame(requestRef.current);
    }, [planet]);

    // Simplified list view for the main panel
    const mainGases = planet.atmosphere.slice(0, 3);

    return (
        <div className="flex flex-col h-full gap-4">
             {/* Header Section */}
             <div className="flex justify-between items-start mb-6">
                 <div>
                     <h2 className="text-3xl font-black text-white leading-none">{planet.name}</h2>
                     {planet.completed && <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 font-bold tracking-widest uppercase inline-block mt-1">CLEARED</span>}
                 </div>
                 {/* Planet Preview Canvas */}
                 <div className="w-24 h-24 border border-blue-900/50 rounded-full overflow-hidden relative shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                     <canvas ref={canvasRef} width={96} height={96} className="w-full h-full"></canvas>
                     <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] pointer-events-none"></div>
                 </div>
             </div>
             
             {/* Stats Grid */}
             <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                 <div className="bg-blue-950/30 p-3 border border-blue-900/50">
                     <div className="text-blue-500 mb-1">{t('THREAT LEVEL')}</div>
                     <div className="text-white text-lg font-bold">{planet.totalWaves} WAVES</div>
                 </div>
                 <div className="bg-blue-950/30 p-3 border border-blue-900/50">
                     <div className="text-blue-500 mb-1">{t('GENE_MODIFIER')}</div>
                     <div className={`text-lg font-bold ${planet.geneStrength > 2 ? 'text-red-400' : 'text-yellow-400'}`}>x{planet.geneStrength.toFixed(1)}</div>
                 </div>
                 <div className="bg-blue-950/30 p-3 border border-blue-900/50 col-span-2">
                     <div className="text-blue-500 mb-1 flex justify-between">
                        <span>SULFUR INDEX</span>
                        <span className="text-yellow-500 font-bold">{planet.sulfurIndex}/10</span>
                     </div>
                     <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${planet.sulfurIndex > 7 ? 'bg-red-500' : planet.sulfurIndex > 4 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                            style={{width: `${(planet.sulfurIndex/10)*100}%`}}
                        ></div>
                     </div>
                 </div>
             </div>

             {/* Atmosphere Section */}
             <div className="bg-blue-950/20 p-4 border border-blue-900/50 flex flex-col gap-3 mt-2 flex-1">
                  <div className="flex justify-between items-center">
                      <label className="text-blue-400 text-xs tracking-widest uppercase font-bold">{t('ATMOSPHERE_COMP')}</label>
                      <button onClick={onShowDetail} className="text-[10px] text-cyan-400 hover:text-white underline cursor-pointer">View Analysis</button>
                  </div>

                  {/* Visual Bar */}
                  <div 
                    onClick={onShowDetail}
                    className="h-4 w-full flex rounded overflow-hidden bg-gray-900 cursor-pointer border border-blue-900/30 hover:border-cyan-400 transition-all shadow-sm"
                  >
                      {planet.atmosphere.map((gas, i) => (
                          <div key={i} style={{ width: `${gas.percentage * 100}%`, backgroundColor: gas.color }}></div>
                      ))}
                  </div>

                  {/* Text Breakdown */}
                  <div className="space-y-1 mt-1">
                      {mainGases.map(gas => (
                          <div key={gas.id} className="flex justify-between items-center text-xs border-b border-blue-900/20 pb-1 last:border-0">
                              <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-sm" style={{backgroundColor: gas.color}}></div>
                                  <span className="text-gray-300 font-mono">{gas.name}</span>
                              </div>
                              <span className="text-white font-bold font-mono">{(gas.percentage * 100).toFixed(1)}%</span>
                          </div>
                      ))}
                      {planet.atmosphere.length > 3 && (
                          <div className="text-[10px] text-gray-500 text-center italic pt-1">+ {planet.atmosphere.length - 3} trace gases</div>
                      )}
                  </div>
             </div>
        </div>
    );
};

// New Component: Atmosphere Pie Chart Modal
const AtmosphereAnalysisModal: React.FC<{ planet: Planet, onClose: () => void }> = ({ planet, onClose }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;
        
        // Dynamic sizing based on container column
        const width = containerRef.current.clientWidth; 
        const height = containerRef.current.clientHeight;
        const radius = Math.min(width, height) / 2.8; // Slightly adjusted for full screen aesthetics

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Ensure SVG fills container
        svg.attr("width", width).attr("height", height);

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        const pie = d3.pie<AtmosphereGas>()
            .value(d => d.percentage)
            .sort(null);

        const arc = d3.arc<d3.PieArcDatum<AtmosphereGas>>()
            .innerRadius(radius * 0.6) // Donut chart
            .outerRadius(radius * 0.9);
        
        // Draw Arcs
        g.selectAll("path")
            .data(pie(planet.atmosphere))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => d.data.color)
            .attr("stroke", "#0f172a") // Match bg for gap effect
            .attr("stroke-width", "4px")
            .style("opacity", 0.9)
            .on("mouseover", function() {
                d3.select(this).style("opacity", 1).attr("transform", "scale(1.05)").attr("stroke-width", "0px");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 0.9).attr("transform", "scale(1)").attr("stroke-width", "4px");
            });

        // Add Center Text
        g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.5em")
            .text("ATMOS")
            .attr("fill", "#64748b")
            .attr("font-size", "24px") // Larger text
            .attr("font-family", "monospace")
            .attr("letter-spacing", "0.2em");
        
        g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "1em")
            .text("100%")
            .attr("fill", "#ffffff")
            .attr("font-size", "64px") // Larger text
            .attr("font-weight", "900")
            .attr("font-family", "monospace");

    }, [planet]);

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 pointer-events-auto flex flex-col">
             {/* Tech Background Grid */}
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
             
             {/* Main Content Container - Full Width/Height */}
            <div className="flex w-full h-full relative z-10">
                <CloseButton onClick={onClose} colorClass="fixed top-8 right-8 w-12 h-12 border-green-500 text-green-500 hover:bg-green-500 hover:text-black z-50 flex items-center justify-center" />
                
                {/* Left: Chart Area - Takes up more space now */}
                <div ref={containerRef} className="w-2/3 h-full bg-gradient-to-br from-slate-900/50 to-slate-950/50 flex flex-col items-center justify-center border-r border-green-900/30 relative">
                     <div className="absolute top-12 left-12">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-3 h-3 bg-green-500 animate-pulse"></div>
                            <h3 className="text-green-500 font-mono tracking-[0.5em] uppercase text-xl">Planetary Atmosphere Analysis</h3>
                        </div>
                        <h1 className="text-6xl text-white font-black tracking-tighter drop-shadow-2xl">{planet.name}</h1>
                        <div className="h-1 w-full bg-gradient-to-r from-green-500 to-transparent mt-4"></div>
                     </div>
                    
                    <svg ref={svgRef} className="z-10 filter drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]"></svg>
                    
                    {/* Decorative Rings behind chart */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[800px] h-[800px] rounded-full border border-green-500/5 animate-[spin_40s_linear_infinite]"></div>
                        <div className="w-[1000px] h-[1000px] rounded-full border border-green-500/5 border-dashed animate-[spin_80s_linear_infinite_reverse]"></div>
                    </div>

                    {/* Scan line overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent h-[5%] w-full animate-[scan_4s_linear_infinite] pointer-events-none"></div>
                </div>

                {/* Right: Data Table */}
                <div className="w-1/3 h-full p-12 overflow-y-auto bg-slate-950/80 relative backdrop-blur-sm border-l border-green-500/20">
                    <div className="mb-12 mt-4">
                        <div className="text-xs text-green-600 font-bold uppercase tracking-[0.3em] mb-4">SPECTROSCOPIC DATA</div>
                        <div className="text-xl text-green-400/80 font-mono leading-relaxed">
                            Full atmospheric breakdown of sector target <span className="text-white font-bold">{planet.name}</span>. 
                            Composition suggests <span className={planet.biome === 'TOXIC' ? 'text-purple-400' : 'text-blue-400'}>{planet.biome}</span> environmental conditions.
                        </div>
                    </div>

                    <div className="space-y-6">
                        {planet.atmosphere.map((gas, i) => (
                            <div key={i} className="group bg-slate-900/50 border border-slate-800 hover:border-green-500 hover:bg-slate-900 p-8 rounded-none transition-all duration-300 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 group-hover:bg-green-500 transition-colors"></div>
                                <div className="flex justify-between items-end mb-4 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-6 h-6 shadow-[0_0_10px_currentColor]" style={{backgroundColor: gas.color, color: gas.color}}></div>
                                        <span className="text-green-100 font-bold font-mono text-2xl tracking-widest uppercase">{gas.name}</span>
                                    </div>
                                    <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{(gas.percentage * 100).toFixed(2)}%</span>
                                </div>
                                <p className="text-base text-slate-400 leading-relaxed font-mono relative z-10 pl-12 group-hover:text-slate-300 transition-colors">
                                    {gas.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="absolute bottom-12 left-12 right-12 pt-8 border-t border-slate-800 flex justify-between items-center text-green-800">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 animate-ping rounded-full"></div>
                            <span className="font-mono text-xs tracking-[0.2em]">UPLINK ESTABLISHED</span>
                         </div>
                         <div className="font-mono text-xs">SECURE CONNECTION</div>
                    </div>
                </div>
            </div>
        </div>
    )
};

// ... (BestiaryPanel, ToggleRow, ShopItem, InteractPrompt, CloseButton, WeaponIcon, TurretUpgradeUI, SaveSlotItem)
const BestiaryPanel: React.FC<{ state: GameState, t: any }> = ({ state, t }) => {
    // ... (Retained original)
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const allEntities = [EnemyType.GRUNT, EnemyType.RUSHER, EnemyType.VIPER, EnemyType.TANK, EnemyType.KAMIKAZE, BossType.RED_SUMMONER, BossType.BLUE_BURST, BossType.PURPLE_ACID];
    const isDiscovered = (id: string) => state.stats.encounteredEnemies.includes(id);
    useEffect(() => {
        if (selectedId && isDiscovered(selectedId) && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, 200, 200); ctx.fillStyle = '#022c22'; ctx.fillRect(0,0,200,200); ctx.strokeStyle = '#065f46'; ctx.strokeRect(0,0,200,200);
            const mockEntity: any = { x: 100, y: 100, radius: 30, angle: -Math.PI / 2, hp: 100, maxHp: 100, color: '#fff', type: selectedId, bossType: selectedId, isBoss: selectedId.includes('BOSS') || selectedId.includes('SUMMONER') || selectedId.includes('BURST') || selectedId.includes('ACID') };
            if (ENEMY_STATS[selectedId as EnemyType]) mockEntity.radius = ENEMY_STATS[selectedId as EnemyType].radius * 2;
            if (BOSS_STATS[selectedId as BossType]) mockEntity.radius = BOSS_STATS[selectedId as BossType].radius * 1.5;
            ctx.save(); ctx.translate(100, 100); ctx.scale(1.5, 1.5); ctx.translate(-100, -100);
            const time = Date.now();
            switch(selectedId) {
                case EnemyType.GRUNT: drawGrunt(ctx, mockEntity, time); break;
                case EnemyType.RUSHER: drawRusher(ctx, mockEntity, time); break;
                case EnemyType.TANK: drawTank(ctx, mockEntity, time); break;
                case EnemyType.KAMIKAZE: drawKamikaze(ctx, mockEntity, time); break;
                case EnemyType.VIPER: drawViper(ctx, mockEntity, time); break;
                case BossType.RED_SUMMONER: drawBossRed(ctx, mockEntity, time); break;
                case BossType.BLUE_BURST: drawBossBlue(ctx, mockEntity, time); break;
                case BossType.PURPLE_ACID: drawBossPurple(ctx, mockEntity, time); break;
            }
            ctx.restore();
        }
    }, [selectedId]);
    return (
        <div className="flex h-full gap-4">
            <div className="w-1/3 border-r border-green-800 pr-2 overflow-y-auto">
                {allEntities.map(id => {
                    const discovered = isDiscovered(id);
                    return (<div key={id} onClick={() => setSelectedId(id)} className={`p-3 mb-2 cursor-pointer border transition-colors flex justify-between items-center ${selectedId === id ? 'bg-green-900 border-green-500 text-white' : 'bg-black/40 border-green-900/50 text-green-700 hover:bg-green-900/20'}`}><span className="font-bold text-xs tracking-widest">{discovered ? (BESTIARY_DB[id]?.codeName || id) : 'UNKNOWN SIGNAL'}</span>{!discovered && <span className="text-[10px] text-green-900 bg-green-900/20 px-1">LOCKED</span>}</div>);
                })}
            </div>
            <div className="flex-1 pl-2">
                {selectedId ? (isDiscovered(selectedId) ? (<div className="h-full flex flex-col animate-fadeIn"><div className="flex gap-4 mb-4"><div className="border border-green-700 w-[200px] h-[200px] bg-black relative"><canvas ref={canvasRef} width={200} height={200} className="w-full h-full" /><div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div></div><div className="flex-1 space-y-2"><div className="text-2xl font-black text-green-400 border-b border-green-800 pb-1">{BESTIARY_DB[selectedId].codeName}</div><div className="text-xs text-green-600 font-bold tracking-widest">{t('CLASSIFICATION')}: {BESTIARY_DB[selectedId].classification}</div><div className="mt-4 grid grid-cols-2 gap-2 text-xs text-green-300"><div className="bg-green-900/30 p-2 border border-green-800"><span className="text-green-600 block text-[10px]">{t('DANGER_LEVEL')}</span><div className="flex gap-0.5 mt-1">{Array.from({length: 10}).map((_, i) => (<div key={i} className={`h-1.5 w-full ${i < BESTIARY_DB[selectedId].danger ? 'bg-red-500' : 'bg-green-900'}`}></div>))}</div></div></div></div></div><div className="flex-1 bg-green-900/10 p-4 border border-green-900/50 text-sm text-green-400 font-mono leading-relaxed overflow-y-auto">{BESTIARY_DB[selectedId].description}</div></div>) : (<div className="h-full flex flex-col items-center justify-center text-green-800 space-y-4"><div className="text-6xl opacity-20">?</div><div className="text-xl font-bold">{t('BESTIARY_LOCKED')}</div><p className="text-xs max-w-xs text-center">{t('BESTIARY_HINT')}</p></div>)) : (<div className="h-full flex items-center justify-center text-green-900 italic">SELECT A TARGET FROM THE INDEX</div>)}
            </div>
        </div>
    );
};

// ... (ToggleRow, ShopItem, InteractPrompt, CloseButton, WeaponIcon, TurretUpgradeUI, SaveSlotItem, SpaceshipView, SpaceshipSlot, ShopModal, WeaponAssemblyModal, TacticalBackpack, MissionFailedScreen, StatRow, TacticalCallInterface, TacticalTerminal)
const ToggleRow: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (<div className="flex items-center justify-between p-3 border border-green-900/50 hover:bg-green-900/20 cursor-pointer" onClick={onClick}><span>{label}</span><div className={`w-12 h-6 rounded-none border border-green-700 relative transition-colors ${active ? 'bg-green-900' : 'bg-black'}`}><div className={`absolute top-0.5 bottom-0.5 w-5 bg-green-500 transition-all ${active ? 'left-[calc(100%-22px)]' : 'left-0.5'}`}></div></div></div>);
interface ShopItemProps { name: string; amount?: string; cost: number; canAfford: boolean; disabled?: boolean; highlight?: boolean; onClick: () => void; label?: string; }
const ShopItem: React.FC<ShopItemProps> = ({ name, amount, cost, canAfford, disabled, highlight, onClick, label }) => (
    <button onClick={onClick} disabled={!canAfford || disabled} className={`p-5 rounded-xl border flex justify-between items-center transition-all group relative overflow-hidden ${disabled ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed opacity-60' : canAfford ? (highlight ? 'bg-gray-800 border-cyan-600 hover:border-cyan-400 text-white' : 'bg-gray-800 border-gray-600 hover:border-yellow-500 text-white') : 'bg-gray-800 border-red-900/30 text-gray-500 cursor-not-allowed'}`}>
        <div className="flex flex-col items-start z-10 max-w-[70%]"><span className={`font-bold text-lg text-left leading-tight ${highlight ? 'text-cyan-200' : ''}`}>{name}</span>{amount && <span className="text-xs text-gray-400 group-hover:text-gray-300 text-left mt-1">{amount}</span>}</div>
        <div className="flex flex-col items-end z-10">{label ? (<span className="text-green-500 font-bold tracking-widest">{label}</span>) : (<><span className={`text-xl font-mono font-bold ${canAfford && !disabled ? "text-yellow-400 group-hover:text-yellow-300" : ""}`}>{cost}</span><span className="text-[10px] uppercase tracking-wider">Scraps</span></>)}</div>
        {canAfford && !disabled && (<div className={`absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${highlight ? 'bg-cyan-500/10' : 'bg-yellow-500/5'}`}></div>)}
    </button>
);
const InteractPrompt: React.FC<{ state: GameState }> = ({ state }) => {
    // ... (Retained original)
    if (state.appMode !== AppMode.GAMEPLAY) return null;
    const p = state.player;
    const distToShop = Math.sqrt(Math.pow(p.x - state.base.x, 2) + Math.pow(p.y - state.base.y, 2));
    if (distToShop < 300 && !state.isShopOpen) {
        return (<div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce"><div className="bg-yellow-500 text-black font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">OPEN SHOP [B]</div><div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-yellow-500 border-r-[8px] border-r-transparent mt-[-1px]"></div></div>)
    }
    let nearTurret = false; let closestSpotIdx = -1; let minDist = 60;
    state.turretSpots.forEach((t, idx) => { const d = Math.sqrt(Math.pow(p.x - t.x, 2) + Math.pow(p.y - t.y, 2)); if (d < minDist) { nearTurret = true; closestSpotIdx = idx; } });
    if (nearTurret && closestSpotIdx !== -1) {
        const spot = state.turretSpots[closestSpotIdx];
        if (spot.builtTurret) { return (<div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce"><div className="bg-emerald-500 text-white font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">UPGRADE [E]</div><div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-emerald-500 border-r-[8px] border-r-transparent mt-[-1px]"></div></div>); } 
        else { const currentCount = state.turretSpots.filter(s => s.builtTurret).length; const cost = TURRET_COSTS.baseCost + (currentCount * TURRET_COSTS.costIncrement); return (<div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce"><div className="bg-blue-600 text-white font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">BUILD [E] - {cost}</div><div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-blue-600 border-r-[8px] border-r-transparent mt-[-1px]"></div></div>); }
    }
    return null;
}

const CloseButton: React.FC<{ onClick: () => void, colorClass?: string }> = ({ onClick, colorClass = "border-gray-500 text-gray-400 hover:text-white hover:bg-gray-700" }) => (
    <button onClick={onClick} className={`absolute top-4 right-4 p-2 rounded-lg border transition-all z-10 ${colorClass}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
);
const WeaponIcon: React.FC<{ type: WeaponType, className?: string }> = ({ type, className }) => {
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
const TurretUpgradeUI: React.FC<{ state: GameState, onConfirmUpgrade: (type: TurretType) => void }> = ({ state, onConfirmUpgrade }) => {
    // ... (Retained original)
    const p = state.player; const turretId = state.activeTurretId; if (turretId === undefined) return null; const turret = state.turretSpots[turretId].builtTurret; if (!turret) return null;
    const upgrades = [{ type: TurretType.GAUSS, name: "GAUSS CANNON", cost: TURRET_COSTS.upgrade_gauss, desc: "High DPS, Rapid Fire" }, { type: TurretType.SNIPER, name: "RAILGUN SNIPER", cost: TURRET_COSTS.upgrade_sniper, desc: "Extreme Range, High Damage" }, { type: TurretType.MISSILE, name: "HELLFIRE MISSILE", cost: TURRET_COSTS.upgrade_missile, desc: "Global Range, Homing, AoE" }];
    return (<div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-50"><div className="bg-gray-900 border-2 border-emerald-500 p-8 rounded-xl max-w-4xl w-full text-center relative"><h2 className="text-3xl font-black text-emerald-500 mb-2">SYSTEM UPGRADE</h2><p className="text-emerald-800 mb-8">SELECT UPGRADE MODULE</p><div className="grid grid-cols-3 gap-6">{upgrades.map(u => { const canAfford = p.score >= u.cost; const stats = TURRET_STATS[u.type]; return (<button key={u.type} disabled={!canAfford} onClick={() => onConfirmUpgrade(u.type)} className={`border-2 p-6 rounded-lg flex flex-col items-center transition-all group ${canAfford ? 'border-gray-700 bg-gray-800 hover:border-emerald-500 hover:bg-gray-700' : 'border-red-900/30 bg-gray-900 opacity-50 cursor-not-allowed'}`}><div className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300">{u.name}</div><div className="text-xs text-gray-400 mb-4 h-8">{u.desc}</div><div className="w-full space-y-2 mb-6"><div className="flex justify-between text-xs text-gray-500"><span>DMG</span><span className="text-white">{stats.damage}</span></div><div className="flex justify-between text-xs text-gray-500"><span>RNG</span><span className="text-white">{stats.range > 2000 ? 'GLOBAL' : stats.range}</span></div><div className="flex justify-between text-xs text-gray-500"><span>SPD</span><span className="text-white">{stats.fireRate}ms</span></div></div><div className={`text-2xl font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-red-500'}`}>{u.cost} <span className="text-sm">SCRAPS</span></div></button>) })}</div><div className="mt-8 text-xs text-gray-600">PRESS [ESC] TO CANCEL</div></div></div>)
}
const SaveSlotItem: React.FC<{ save: SaveFile, onLoad: () => void, onDelete: () => void, onPin: () => void, t: any }> = ({ save, onLoad, onDelete, onPin, t }) => {
    // ... (Retained original)
    return (<div className={`p-4 border-l-2 flex flex-col gap-2 transition-all relative group ${save.isPinned ? 'bg-blue-900/20 border-blue-400' : 'bg-gray-900/40 border-gray-700 hover:border-blue-500/50'}`}><div className="flex justify-between items-start"><div><div className={`text-xs font-bold tracking-widest ${save.isPinned ? 'text-blue-300' : 'text-gray-400'}`}>{save.label}</div><div className="text-[10px] text-gray-600 mt-0.5">{new Date(save.timestamp).toLocaleString()}</div></div>{save.isPinned && (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>)}</div><div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={onLoad} className="flex-1 bg-blue-900/50 hover:bg-blue-600 text-blue-200 text-[10px] py-1 border border-blue-800 hover:border-blue-500">{t('LOAD')}</button><button onClick={onPin} className="px-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] py-1 border border-gray-700">{save.isPinned ? t('UNPIN') : t('PIN')}</button><button onClick={onDelete} className="px-2 bg-red-900/20 hover:bg-red-900/50 text-red-500 text-[10px] py-1 border border-red-900/30">✕</button></div></div>)
}
// Spaceship View Component
const SpaceshipView: React.FC<{ state: GameState, onClose: () => void }> = ({ state, onClose }) => {
    return (
        <div className="absolute inset-0 bg-slate-950 z-[200] flex flex-col overflow-hidden pointer-events-auto select-none">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 perspective-[1000px] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
            </div>

            {/* Top UI Bar */}
            <div className="relative z-10 flex justify-between items-start p-8 w-full pointer-events-none">
                {/* Left: Scraps / Fragments */}
                <div className="flex flex-col gap-2 pointer-events-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 animate-pulse"></div>
                        <span className="text-cyan-600 text-[10px] font-mono tracking-[0.2em] uppercase">Storage Access</span>
                    </div>
                    <div className="bg-slate-900/90 border-l-2 border-cyan-500 px-6 py-2 backdrop-blur-md shadow-lg flex items-baseline gap-3">
                         <span className="text-3xl font-black text-white font-mono tracking-tighter tabular-nums">{Math.floor(state.player.score)}</span>
                         <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">FRAGMENTS</span>
                    </div>
                </div>

                {/* Right: Ship Class Info */}
                 <div className="text-right pointer-events-auto opacity-80">
                     <h1 className="text-4xl font-black italic text-slate-700 tracking-tighter uppercase">
                         Colossus <span className="text-slate-600">Class</span>
                     </h1>
                     <div className="flex justify-end items-center gap-2 mt-1">
                         <div className="h-px w-24 bg-cyan-900"></div>
                         <span className="text-cyan-800 font-mono text-[10px] tracking-[0.3em]">HEAVY CRUISER</span>
                     </div>
                </div>
            </div>

            {/* Main Content: Ship Graphic */}
            <div className="flex-1 relative flex items-center justify-center w-full overflow-visible">
                {/* SVG Container */}
                <div className="relative w-[1000px] h-[500px] filter drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <svg viewBox="0 0 1000 500" className="w-full h-full">
                        <defs>
                            <linearGradient id="hullMetal" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#0f172a" />
                                <stop offset="50%" stopColor="#1e293b" />
                                <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>
                            <linearGradient id="engineGlow" x1="1" y1="0" x2="0" y2="0">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8"/>
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                            <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.3"/>
                            </pattern>
                        </defs>

                        {/* --- SHIP GRAPHIC (Side View, Pointing Right) --- */}
                        <g transform="translate(50, 100)">
                            {/* Engine Exhausts (Rear Left) */}
                            <path d="M 0 120 L -80 100 L -80 160 L 0 140 Z" fill="url(#engineGlow)" className="animate-pulse" />
                            <path d="M 0 180 L -100 160 L -100 220 L 0 200 Z" fill="url(#engineGlow)" className="animate-pulse" style={{animationDelay: '0.1s'}} />
                            
                            {/* Main Hull Body (Rear Block) */}
                            <path d="M 0 80 L 250 80 L 280 120 L 250 240 L 0 240 L -20 160 Z" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                            {/* Texture lines */}
                            <path d="M 50 80 L 50 240" stroke="#0f172a" strokeWidth="2" />
                            <path d="M 150 80 L 150 240" stroke="#0f172a" strokeWidth="2" />
                            
                            {/* Bridge Tower (Top Rear) */}
                            <path d="M 180 80 L 200 40 L 260 40 L 240 80 Z" fill="#334155" stroke="#475569" strokeWidth="2" />
                            <rect x="250" y="45" width="2" height="10" fill="#06b6d4" className="animate-pulse" />

                            {/* Mid Section (Neck) */}
                            <path d="M 280 120 L 600 130 L 600 210 L 250 240 Z" fill="url(#hullMetal)" stroke="#334155" strokeWidth="2" />
                            {/* Piping details on neck */}
                            <path d="M 300 140 L 580 145" stroke="#334155" strokeWidth="4" />
                            <path d="M 300 155 L 580 160" stroke="#334155" strokeWidth="4" />
                            <path d="M 300 200 L 500 210" stroke="#334155" strokeWidth="6" strokeDasharray="10,5" />

                            {/* Front Section (Prow/Nose) */}
                            <path d="M 600 110 L 850 140 L 900 170 L 850 200 L 600 230 Z" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                            {/* Nose Detail */}
                            <path d="M 750 140 L 880 170 L 750 200" fill="none" stroke="#334155" strokeWidth="2" />
                            <circle cx="820" cy="170" r="4" fill="#ef4444" className="animate-pulse" />

                            {/* Ventral Fin / Cargo Bay (Bottom) */}
                            <path d="M 350 225 L 550 220 L 520 280 L 380 280 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                            
                            {/* Dorsal Fin / Antennae (Top) */}
                            <path d="M 400 125 L 420 80 L 500 80 L 480 125 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                            <line x1="450" y1="80" x2="450" y2="20" stroke="#475569" strokeWidth="2" />
                            <circle cx="450" cy="20" r="2" fill="#06b6d4" />

                            {/* Tech Overlay Lines */}
                            <rect x="0" y="40" width="900" height="260" fill="url(#gridPattern)" style={{mixBlendMode: 'overlay'}} />
                        </g>

                        {/* Connection Lines to Slots */}
                        {/* Nose -> Sensor */}
                        <path d="M 870 270 L 920 270 L 950 300" stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.5" />
                        
                        {/* Bridge -> Core/System */}
                        <path d="M 230 140 L 230 50 L 150 50" stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.5" />

                        {/* Weapon hardpoints */}
                        <path d="M 500 180 L 500 50" stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.5" />
                        <path d="M 500 350 L 500 420" stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.5" />

                    </svg>

                    {/* --- MODULE SLOTS --- */}
                    
                    {/* Slot 1: Nose (Sensor Array) */}
                    <div className="absolute top-[55%] right-[5%]">
                        <SpaceshipSlot label="SENSOR SUITE" active={false} icon="📡" />
                    </div>

                    {/* Slot 2: Top Hardpoint */}
                    <div className="absolute top-[10%] left-[50%]">
                         <SpaceshipSlot label="DORSAL MOUNT" active={false} icon="⚔️" />
                    </div>

                    {/* Slot 3: Bottom Hardpoint */}
                    <div className="absolute bottom-[10%] left-[50%]">
                         <SpaceshipSlot label="VENTRAL MOUNT" active={false} icon="💣" />
                    </div>

                    {/* Slot 4: Core (Rear/Bridge) */}
                    <div className="absolute top-[10%] left-[15%]">
                         <SpaceshipSlot label="HYPER CORE" active={false} icon="☢️" isCore />
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-8 z-20 pointer-events-auto">
                <button 
                    onClick={onClose}
                    className="group flex items-center gap-3 px-6 py-3 bg-slate-900/80 border border-slate-700 hover:border-cyan-500 transition-all text-slate-400 hover:text-white"
                >
                    <span className="text-xl">«</span>
                    <span className="font-mono text-xs tracking-widest uppercase">Return to Sector</span>
                </button>
            </div>
            
            <div className="absolute bottom-8 right-8 z-20">
                <div className="text-right text-[10px] text-slate-600 font-mono">
                    <div>VESSEL STATUS: ONLINE</div>
                    <div>HULL INTEGRITY: 100%</div>
                </div>
            </div>

        </div>
    )
}

// Updated Helper for Ship Slot with new styling
const SpaceshipSlot: React.FC<{ label: string, active: boolean, isCore?: boolean, icon?: string }> = ({ label, active, isCore, icon }) => (
    <div className="flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform duration-300">
        <div className={`
            relative flex items-center justify-center 
            ${isCore ? 'w-20 h-20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'w-16 h-16 border-slate-600 group-hover:border-cyan-500'}
            bg-slate-950/90 border backdrop-blur-sm
            transition-colors duration-300
        `}>
            {/* Corner Accents */}
            <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-current opacity-50"></div>
            <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-current opacity-50"></div>
            
            <div className="text-2xl opacity-70 group-hover:opacity-100 transition-opacity filter drop-shadow-lg">
                {icon || "+"}
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <div className={`h-px w-4 ${isCore ? 'bg-cyan-500' : 'bg-slate-700 group-hover:bg-cyan-500'} transition-colors`}></div>
            <span className={`text-[9px] font-mono tracking-widest uppercase ${isCore ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'} transition-colors bg-slate-900/80 px-2 py-0.5`}>
                {label}
            </span>
        </div>
    </div>
)
// --- Shop Modal Component ---
const ShopModal: React.FC<{ state: GameState, onPurchase: (item: string) => void, onClose: () => void, t: any }> = ({ state, onPurchase, onClose, t }) => {
    const p = state.player;
    const [activeTab, setActiveTab] = useState<'AMMO' | 'WEAPONS' | 'DEFENSE' | 'MODULES'>('AMMO');

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto z-40 backdrop-blur-sm">
           <div className="bg-gray-900 border-2 border-yellow-600/50 p-8 rounded-2xl shadow-2xl max-w-4xl w-full relative overflow-hidden flex flex-col h-[600px]">
               {/* Decorative background element */}
               <div className="absolute top-0 right-0 p-32 bg-yellow-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

               {/* Close Button Top Right (Fixed) */}
               <CloseButton onClick={onClose} colorClass="border-yellow-600 text-yellow-500 hover:bg-yellow-900/40 hover:text-yellow-300" />

               {/* Header */}
               <div className="flex justify-between items-end mb-6 border-b border-gray-800 pb-4 mt-8">
                   <div>
                       <h2 className="text-4xl font-black text-white tracking-tight">{t('DEPOT_TITLE').split(" ")[0]} <span className="text-yellow-500">{t('DEPOT_TITLE').split(" ")[1]}</span></h2>
                       <p className="text-gray-500 text-sm mt-1">{t('DEPOT_SUBTITLE')}</p>
                   </div>
                   <div className="text-right">
                       <div className="text-sm text-gray-400 uppercase tracking-widest">{t('FUNDS')}</div>
                       <div className="text-3xl font-mono text-yellow-400 font-bold">{Math.floor(p.score)} <span className="text-lg">{t('SCRAPS')}</span></div>
                   </div>
               </div>

               {/* Tabs */}
               <div className="flex space-x-4 mb-6">
                    {(['AMMO', 'WEAPONS', 'DEFENSE', 'MODULES'] as const).map(tabKey => (
                         <button 
                            key={tabKey}
                            onClick={() => setActiveTab(tabKey)}
                            className={`flex-1 py-3 text-center font-bold tracking-wider rounded-t-lg transition-colors border-b-2 
                                ${activeTab === tabKey 
                                ? 'bg-gray-800 text-yellow-400 border-yellow-500' 
                                : 'bg-gray-900 text-gray-500 border-gray-700 hover:text-gray-300'}`}
                        >
                            {t(`TAB_${tabKey}`)}
                        </button>
                    ))}
               </div>

               {/* Content */}
               <div className="flex-1 overflow-y-auto pr-2">
                   {activeTab === 'AMMO' && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <ShopItem 
                                name="Assault Rifle Ammo"
                                amount="+60 Rnds" 
                                cost={SHOP_PRICES.AR_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.AR_AMMO}
                                onClick={() => onPurchase('AR_AMMO')}
                            />
                            <ShopItem 
                                name="Shotgun Shells" 
                                amount="+16 Shells"
                                cost={SHOP_PRICES.SG_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.SG_AMMO}
                                onClick={() => onPurchase('SG_AMMO')}
                            />
                            <ShopItem 
                                name="Sniper Rounds" 
                                amount="+10 Rnds"
                                cost={SHOP_PRICES.SR_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.SR_AMMO}
                                onClick={() => onPurchase('SR_AMMO')}
                            />
                            <ShopItem 
                                name="Frag Grenade" 
                                amount="+1 Unit"
                                cost={SHOP_PRICES.GRENADE} 
                                canAfford={p.score >= SHOP_PRICES.GRENADE && p.grenades < PLAYER_STATS.maxGrenades}
                                onClick={() => onPurchase('GRENADE')}
                                disabled={p.grenades >= PLAYER_STATS.maxGrenades}
                            />
                            
                             {/* New Ammo Types */}
                            <ShopItem 
                                name="Pulse Cells" 
                                amount="+90 Energy"
                                cost={SHOP_PRICES.PULSE_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.PULSE_AMMO}
                                onClick={() => onPurchase('PULSE_AMMO')}
                            />
                            <ShopItem 
                                name="Napalm Tanks" 
                                amount="+200 Fuel"
                                cost={SHOP_PRICES.FLAME_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.FLAME_AMMO}
                                onClick={() => onPurchase('FLAME_AMMO')}
                            />
                             <ShopItem 
                                name="40mm Grenades" 
                                amount="+12 Rnds"
                                cost={SHOP_PRICES.GL_AMMO} 
                                canAfford={p.score >= SHOP_PRICES.GL_AMMO}
                                onClick={() => onPurchase('GL_AMMO')}
                            />
                        </div>
                   )}

                   {activeTab === 'WEAPONS' && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <ShopItem 
                                name="Pulse Rifle" 
                                amount="Energy Weapon"
                                cost={SHOP_PRICES.WEAPON_PULSE} 
                                canAfford={p.score >= SHOP_PRICES.WEAPON_PULSE}
                                onClick={() => onPurchase('WEAPON_PULSE')}
                                highlight
                            />
                            <ShopItem 
                                name="Flamethrower" 
                                amount="Incendiary"
                                cost={SHOP_PRICES.WEAPON_FLAME} 
                                canAfford={p.score >= SHOP_PRICES.WEAPON_FLAME}
                                onClick={() => onPurchase('WEAPON_FLAME')}
                                highlight
                            />
                            <ShopItem 
                                name="Grenade Launcher" 
                                amount="Heavy Explosive"
                                cost={SHOP_PRICES.WEAPON_GL} 
                                canAfford={p.score >= SHOP_PRICES.WEAPON_GL}
                                onClick={() => onPurchase('WEAPON_GL')}
                                highlight
                            />
                        </div>
                   )}

                   {activeTab === 'DEFENSE' && (
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                           <ShopItem 
                                name={t('UPGRADE_INFECTION')}
                                amount={t('UPGRADE_INFECTION_DESC')}
                                cost={DEFENSE_UPGRADE_INFO[DefenseUpgradeType.INFECTION_DISPOSAL].cost}
                                canAfford={p.score >= DEFENSE_UPGRADE_INFO[DefenseUpgradeType.INFECTION_DISPOSAL].cost}
                                disabled={p.upgrades.includes(DefenseUpgradeType.INFECTION_DISPOSAL)}
                                onClick={() => onPurchase(DefenseUpgradeType.INFECTION_DISPOSAL)}
                                label={p.upgrades.includes(DefenseUpgradeType.INFECTION_DISPOSAL) ? t('OWNED') : undefined}
                                highlight
                            />
                            <ShopItem 
                                name={t('UPGRADE_SPORE')}
                                amount={t('UPGRADE_SPORE_DESC')}
                                cost={DEFENSE_UPGRADE_INFO[DefenseUpgradeType.SPORE_BARRIER].cost}
                                canAfford={p.score >= DEFENSE_UPGRADE_INFO[DefenseUpgradeType.SPORE_BARRIER].cost}
                                disabled={p.upgrades.includes(DefenseUpgradeType.SPORE_BARRIER)}
                                onClick={() => onPurchase(DefenseUpgradeType.SPORE_BARRIER)}
                                label={p.upgrades.includes(DefenseUpgradeType.SPORE_BARRIER) ? t('OWNED') : undefined}
                                highlight
                            />
                            <ShopItem 
                                name={t('UPGRADE_IMPACT')}
                                amount={t('UPGRADE_IMPACT_DESC')}
                                cost={DEFENSE_UPGRADE_INFO[DefenseUpgradeType.IMPACT_PLATE].cost}
                                canAfford={p.score >= DEFENSE_UPGRADE_INFO[DefenseUpgradeType.IMPACT_PLATE].cost}
                                disabled={p.upgrades.includes(DefenseUpgradeType.IMPACT_PLATE)}
                                onClick={() => onPurchase(DefenseUpgradeType.IMPACT_PLATE)}
                                label={p.upgrades.includes(DefenseUpgradeType.IMPACT_PLATE) ? t('OWNED') : undefined}
                                highlight
                            />
                       </div>
                   )}

                   {activeTab === 'MODULES' && (
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                           {Object.values(ModuleType).map(mType => {
                               const stats = MODULE_STATS[mType];
                               return (
                                   <ShopItem
                                        key={mType}
                                        name={stats.name}
                                        amount={stats.desc}
                                        cost={stats.cost}
                                        canAfford={p.score >= stats.cost}
                                        onClick={() => onPurchase(mType)}
                                        highlight
                                   />
                               );
                           })}
                       </div>
                   )}
               </div>
           </div>
        </div>
    );
};

// ... (WeaponAssemblyModal, TacticalBackpack, MissionFailedScreen, StatRow, TacticalCallInterface, TacticalTerminal)
const WeaponAssemblyModal: React.FC<{ weaponType: WeaponType | 'GRENADE', state: GameState, onClose: () => void, t: any }> = ({ weaponType, state, onClose, t }) => {
    const p = state.player;
    
    // Determine target modules array and slots
    let installedModules: WeaponModule[] = [];
    let maxSlots = 3;
    let weaponName = "";

    if (weaponType === 'GRENADE') {
        installedModules = p.grenadeModules;
        maxSlots = 2;
        weaponName = t('GRENADE');
    } else {
        installedModules = p.weapons[weaponType].modules;
        if (weaponType === WeaponType.PISTOL) maxSlots = 2;
        weaponName = WEAPONS[weaponType].name;
    }

    const handleEquip = (modId: string) => {
        // Dispatch event to app
        const event = new CustomEvent('game-action', { detail: { type: 'EQUIP_MODULE', target: weaponType, modId } });
        window.dispatchEvent(event);
    };

    const handleUnequip = (modId: string) => {
        const event = new CustomEvent('game-action', { detail: { type: 'UNEQUIP_MODULE', target: weaponType, modId } });
        window.dispatchEvent(event);
    };

    return (
        <div className="absolute inset-0 bg-black/90 z-[150] flex items-center justify-center pointer-events-auto">
            <div className="bg-gray-800 border-2 border-cyan-600 p-8 rounded-lg max-w-2xl w-full flex flex-col gap-6 relative shadow-2xl">
                 <CloseButton onClick={onClose} colorClass="border-cyan-600 text-cyan-500 hover:text-white hover:bg-cyan-900" />
                 
                 <div className="text-center border-b border-gray-700 pb-4">
                     <h2 className="text-2xl font-black text-cyan-400 tracking-widest">{t('ASSEMBLY_TITLE')}</h2>
                     <div className="text-white text-lg mt-2 font-bold">{weaponName}</div>
                 </div>

                 {/* Slots Visualization */}
                 <div className="flex justify-center gap-8 py-8 bg-black/30 rounded-lg">
                     {Array.from({length: maxSlots}).map((_, i) => {
                         const mod = installedModules[i];
                         return (
                             <div key={i} className="flex flex-col items-center gap-2">
                                 <div 
                                    className={`w-20 h-20 rounded-full border-2 flex items-center justify-center relative
                                        ${mod ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-600 border-dashed bg-gray-900/50'}
                                    `}
                                 >
                                     {mod ? (
                                         <>
                                            <div className="text-2xl">⚙️</div>
                                            <button 
                                                onClick={() => handleUnequip(mod.id)}
                                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500 border border-black"
                                            >✕</button>
                                         </>
                                     ) : (
                                         <div className="text-gray-600 text-xs">{t('EMPTY_SLOT')}</div>
                                     )}
                                 </div>
                                 {mod && (
                                     <div className="text-[10px] text-cyan-200 w-24 text-center leading-tight">
                                         {MODULE_STATS[mod.type].name}
                                     </div>
                                 )}
                             </div>
                         )
                     })}
                 </div>

                 {/* Available Inventory */}
                 <div className="bg-black/20 p-4 rounded-lg border border-gray-700 flex-1 min-h-[200px]">
                     <h3 className="text-gray-400 text-xs font-bold tracking-widest mb-4 border-b border-gray-700 pb-2">{t('MODULES_STORAGE')}</h3>
                     
                     <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
                         {p.freeModules.length === 0 && (
                             <div className="col-span-2 text-center text-gray-600 italic py-8">NO MODULES AVAILABLE</div>
                         )}
                         {p.freeModules.map(mod => {
                             const config = MODULE_STATS[mod.type];
                             const isCompatible = checkCompatibility(mod.type, weaponType);
                             
                             return (
                                 <button
                                    key={mod.id}
                                    onClick={() => isCompatible && handleEquip(mod.id)}
                                    disabled={!isCompatible}
                                    className={`p-3 border rounded flex justify-between items-center text-left transition-all
                                        ${isCompatible 
                                            ? 'bg-gray-700 border-gray-600 hover:border-cyan-500 hover:bg-gray-600 cursor-pointer' 
                                            : 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed'}
                                    `}
                                 >
                                     <div>
                                         <div className={`text-sm font-bold ${isCompatible ? 'text-white' : 'text-gray-500'}`}>{config.name}</div>
                                         <div className="text-[10px] text-gray-400">{config.desc}</div>
                                     </div>
                                     {isCompatible ? (
                                         <span className="text-cyan-500 text-xl">➜</span>
                                     ) : (
                                         <span className="text-red-900 text-xs font-bold">N/A</span>
                                     )}
                                 </button>
                             )
                         })}
                     </div>
                 </div>
            </div>
        </div>
    );
};

// Helper for Assembly UI to check compat
function checkCompatibility(modType: ModuleType, target: WeaponType | 'GRENADE'): boolean {
    const config = MODULE_STATS[modType] as any;
    if (config.exclude && config.exclude.includes(target)) return false;
    if (config.only && !config.only.includes(target)) return false;
    return true;
}

// --- Tactical Backpack Component ---
const TacticalBackpack: React.FC<{ state: GameState, onSwapItems: (lIdx: number, iIdx: number) => void, onClose: () => void, t: any }> = ({ state, onSwapItems, onClose, t }) => {
    const p = state.player;
    const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
    const [assemblyTarget, setAssemblyTarget] = useState<WeaponType | 'GRENADE' | null>(null);

    const handleDragStart = (e: React.DragEvent, idx: number) => {
        setDraggedItemIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, loadoutIdx: number) => {
        e.preventDefault();
        if (draggedItemIdx !== null) {
            onSwapItems(loadoutIdx, draggedItemIdx);
            setDraggedItemIdx(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    return (
        <div className="absolute inset-0 z-[100] bg-gray-900/95 pointer-events-auto flex items-center justify-center font-mono">
            {/* Background pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle,transparent_20%,#000_20%,#000_80%,transparent_80%,transparent),radial-gradient(circle,transparent_20%,#000_20%,#000_80%,transparent_80%,transparent)] bg-[size:20px_20px] bg-[position:0_0,10px_10px]"></div>

            {assemblyTarget && (
                <WeaponAssemblyModal 
                    weaponType={assemblyTarget} 
                    state={state} 
                    onClose={() => setAssemblyTarget(null)} 
                    t={t}
                />
            )}

            <div className="relative w-[900px] bg-gray-800 border-2 border-gray-600 shadow-2xl p-8 flex gap-8 rounded-lg">
                
                {/* Close Button */}
                <CloseButton onClick={onClose} colorClass="border-gray-500 text-gray-400 hover:text-white hover:bg-gray-700" />

                {/* Left Column: Stats */}
                <div className="w-1/4 flex flex-col gap-4">
                    <div className="bg-black/50 p-4 border border-gray-700">
                        <h3 className="text-gray-400 font-bold mb-2 text-xs tracking-widest">{t('STATUS_HEADER')}</h3>
                        <div className="mb-2">
                            <div className="flex justify-between text-white text-sm"><span>{t('HEALTH')}</span><span>{Math.floor(p.hp)}/{p.maxHp}</span></div>
                            <div className="h-2 w-full bg-gray-900 mt-1"><div className="h-full bg-red-600" style={{width: `${(p.hp/p.maxHp)*100}%`}}></div></div>
                        </div>
                        <div className="mb-2">
                            <div className="flex justify-between text-white text-sm"><span>{t('ARMOR')}</span><span>{Math.floor(p.armor)}/{p.maxArmor}</span></div>
                            <div className="h-2 w-full bg-gray-900 mt-1"><div className="h-full bg-blue-600" style={{width: `${(p.armor/p.maxArmor)*100}%`}}></div></div>
                        </div>
                        <div>
                             <div className="flex justify-between text-white text-sm"><span>{t('SCRAPS')}</span><span className="text-yellow-400">{Math.floor(p.score)}</span></div>
                        </div>
                    </div>

                     <div className="bg-black/50 p-4 border border-gray-700 flex-1">
                        <h3 className="text-gray-400 font-bold mb-4 text-xs tracking-widest">{t('UTILITIES')}</h3>
                        
                        {/* Grenade Button (Clickable for Assembly) */}
                        <button 
                            onClick={() => setAssemblyTarget('GRENADE')}
                            className="flex items-center gap-4 text-white w-full p-2 hover:bg-white/5 rounded transition-colors group text-left"
                        >
                            <div className="w-12 h-12 bg-gray-700 rounded border border-gray-600 flex items-center justify-center group-hover:border-cyan-500 relative">
                                <div className="w-4 h-6 bg-orange-500 rounded-sm"></div>
                                {/* Slots dots */}
                                <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                                    {p.grenadeModules.map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-cyan-400 border border-black"></div>)}
                                </div>
                            </div>
                            <div>
                                <div className="font-bold group-hover:text-cyan-400 transition-colors">{t('GRENADE')}</div>
                                <div className="text-xs text-gray-400">x{p.grenades}</div>
                            </div>
                        </button>

                        {/* Defense Upgrades Display */}
                        {p.upgrades.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-gray-400 font-bold mb-2 text-xs tracking-widest">{t('ACTIVE_SYSTEMS')}</h3>
                                <div className="space-y-2">
                                    {p.upgrades.map(u => {
                                        let nameKey = '';
                                        if (u === DefenseUpgradeType.INFECTION_DISPOSAL) nameKey = 'UPGRADE_INFECTION';
                                        if (u === DefenseUpgradeType.SPORE_BARRIER) nameKey = 'UPGRADE_SPORE';
                                        if (u === DefenseUpgradeType.IMPACT_PLATE) nameKey = 'UPGRADE_IMPACT';
                                        
                                        return (
                                            <div key={u} className="bg-gray-700/50 p-2 text-xs border-l-2 border-emerald-500 text-gray-300">
                                                {t(nameKey)}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                     </div>
                </div>

                {/* Right Column: Loadout & Inventory */}
                <div className="flex-1 flex flex-col gap-6">
                    
                    {/* Loadout Section */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2 tracking-wide border-b border-gray-600 pb-2">{t('LOADOUT_HEADER')}</h2>
                        <p className="text-xs text-gray-500 mb-4">{t('LOADOUT_HINT')}</p>
                        <div className="flex gap-4">
                            {p.loadout.map((wType, idx) => {
                                const installedCount = p.weapons[wType].modules.length;
                                return (
                                    <div 
                                        key={idx}
                                        onDrop={(e) => handleDrop(e, idx)}
                                        onDragOver={handleDragOver}
                                        onClick={() => setAssemblyTarget(wType)}
                                        className="relative w-32 h-32 bg-black/40 border-2 border-dashed border-gray-600 rounded flex flex-col items-center justify-center group hover:border-cyan-500 cursor-pointer transition-all hover:bg-gray-800"
                                    >
                                        <div className="absolute top-1 left-2 text-xs text-gray-600 font-bold">{t('SLOT')} {idx+1}</div>
                                        <WeaponIcon type={wType} className="w-16 h-16 fill-gray-400 group-hover:fill-cyan-400" />
                                        <div className="text-xs font-bold text-white text-center px-1 mt-2">{WEAPONS[wType].name}</div>
                                        <div className="text-[10px] text-gray-400">{idx === 3 ? t('SLOT_SIDEARM') : t('SLOT_MAIN')}</div>
                                        
                                        {/* Module Indicator Dots */}
                                        <div className="absolute bottom-2 right-2 flex gap-1">
                                            {Array.from({length: installedCount}).map((_, i) => (
                                                <div key={i} className="w-2 h-2 rounded-full bg-cyan-400 border border-black shadow-[0_0_4px_cyan]"></div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Backpack Grid */}
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-4 tracking-wide border-b border-gray-600 pb-2">{t('BACKPACK_HEADER')}</h2>
                        <div className="grid grid-cols-6 gap-2">
                            {Array.from({length: INVENTORY_SIZE}).map((_, idx) => {
                                const item = p.inventory[idx];
                                return (
                                    <div 
                                        key={idx}
                                        draggable={!!item}
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        className={`
                                            w-16 h-16 border rounded flex items-center justify-center relative
                                            ${item ? 'bg-gray-700 border-gray-500 cursor-grab hover:bg-gray-600' : 'bg-black/20 border-gray-800'}
                                        `}
                                    >
                                        {item && (
                                            <>
                                                <WeaponIcon type={item.type} className="w-10 h-10 fill-gray-300" />
                                                <div className="absolute bottom-0.5 right-1 text-[8px] text-gray-300">
                                                    {WEAPONS[item.type].name.substring(0,3).toUpperCase()}
                                                </div>
                                            </>
                                        )}
                                        <div className="absolute top-0.5 left-1 text-[8px] text-gray-700">{idx+1}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-4 right-8 text-xs text-gray-500">
                    {t('CLOSE_BACKPACK')}
                </div>
            </div>
        </div>
    );
};

const MissionFailedScreen: React.FC<{ state: GameState, onRestart: () => void }> = ({ state, onRestart }) => {
    // ... (Retained original)
    const handleDownloadReport = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 800, 600);
        ctx.strokeStyle = '#331111';
        ctx.lineWidth = 1;
        for (let i = 0; i < 800; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke(); }
        for (let i = 0; i < 600; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke(); }
        ctx.fillStyle = '#b91c1c'; ctx.font = 'bold 60px Courier New, monospace'; ctx.fillText('MISSION FAILED', 50, 80);
        ctx.fillStyle = '#7f1d1d'; ctx.font = '20px Courier New, monospace'; ctx.fillText('// AFTER ACTION REPORT // CLASSIFIED', 50, 110);
        ctx.fillText(`// DATE: ${new Date().toLocaleDateString()}`, 50, 135);
        ctx.lineWidth = 4; ctx.strokeStyle = '#b91c1c'; ctx.strokeRect(20, 20, 760, 560);
        ctx.fillStyle = '#ffffff'; ctx.font = '24px Courier New, monospace';
        const drawStat = (label: string, value: string | number, x: number, y: number) => {
            ctx.fillStyle = '#9ca3af'; ctx.fillText(label, x, y);
            ctx.fillStyle = '#ffffff'; ctx.fillText(String(value), x + 250, y);
        };
        let y = 200;
        drawStat('WAVES SURVIVED', state.wave, 50, y); y += 40;
        drawStat('TOTAL SCORE', Math.floor(state.player.score), 50, y); y += 40;
        drawStat('DAMAGE DEALT', state.stats.damageDealt.toLocaleString(), 50, y); y += 40;
        drawStat('SHOTS FIRED', state.stats.shotsFired.toLocaleString(), 50, y); y += 40;
        const accuracy = state.stats.shotsFired > 0 ? ((state.stats.shotsHit / state.stats.shotsFired) * 100).toFixed(1) + '%' : '0%';
        drawStat('ACCURACY', accuracy, 50, y); y += 40;
        y = 200; const x2 = 450;
        ctx.fillStyle = '#ef4444'; ctx.fillText('CONFIRMED KILLS', x2, y - 10);
        ctx.font = '18px Courier New, monospace';
        Object.entries(state.stats.killsByType).forEach(([type, count], idx) => {
            ctx.fillStyle = '#9ca3af'; ctx.fillText(type, x2, y + 30 + (idx * 30));
            ctx.fillStyle = '#ef4444'; ctx.fillText(String(count), x2 + 200, y + 30 + (idx * 30));
        });
        ctx.fillStyle = '#331111'; ctx.font = 'bold 100px Arial'; ctx.save();
        ctx.translate(400, 300); ctx.rotate(-Math.PI / 6); ctx.textAlign = 'center'; ctx.fillText('TERMINATED', 0, 0); ctx.restore();
        const image = canvas.toDataURL("image/jpeg");
        const link = document.createElement('a');
        link.href = image; link.download = `MissionReport_${Date.now()}.jpg`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    return (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center pointer-events-auto font-mono text-red-600">
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(50,0,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(50,0,0,0.2)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
             <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
             <div className="relative z-10 border-4 border-red-900 bg-black/90 p-12 max-w-4xl w-full shadow-[0_0_50px_rgba(220,38,38,0.3)]">
                 <div className="flex justify-between items-start mb-8 border-b-2 border-red-900 pb-4">
                     <div>
                         <h1 className="text-6xl font-black tracking-tighter text-red-600 mb-2 glitch-text">MISSION FAILED</h1>
                         <p className="text-red-800 tracking-[0.5em] text-sm font-bold">SIGNAL LOST // BASE DESTROYED</p>
                     </div>
                     <div className="text-right">
                         <div className="text-red-900 text-xs">REPORT ID</div>
                         <div className="text-red-500 font-bold">#A7-XX-{Math.floor(Math.random()*9999)}</div>
                     </div>
                 </div>
                 <div className="grid grid-cols-2 gap-12 mb-12">
                     <div className="space-y-4">
                         <StatRow label="WAVES SURVIVED" value={state.wave} />
                         <StatRow label="FINAL SCORE" value={Math.floor(state.player.score)} />
                         <StatRow label="DAMAGE DEALT" value={state.stats.damageDealt.toLocaleString()} />
                         <StatRow label="SHOTS FIRED" value={state.stats.shotsFired.toLocaleString()} />
                         <StatRow label="ACCURACY" value={state.stats.shotsFired > 0 ? ((state.stats.shotsHit / state.stats.shotsFired) * 100).toFixed(1) + '%' : '0%'} />
                     </div>
                     <div>
                         <h3 className="text-red-500 border-b border-red-900/50 pb-2 mb-4 font-bold tracking-widest">HOSTILES ELIMINATED</h3>
                         <div className="space-y-2">
                             {Object.entries(state.stats.killsByType).map(([type, count]) => (
                                 <div key={type} className="flex justify-between text-sm">
                                     <span className="text-red-800">{type}</span>
                                     <span className="text-red-500 font-bold">{count}</span>
                                 </div>
                             ))}
                         </div>
                         <div className="mt-6 pt-4 border-t border-red-900/50 flex justify-between">
                             <span className="text-red-400 font-bold">TOTAL KILLS</span>
                             <span className="text-2xl text-white font-bold">
                                 {(Object.values(state.stats.killsByType) as number[]).reduce((a, b) => a + b, 0)}
                             </span>
                         </div>
                     </div>
                 </div>
                 <div className="flex justify-center gap-6">
                     <button onClick={onRestart} className="px-8 py-4 bg-red-900 hover:bg-red-800 text-white font-bold tracking-widest uppercase border border-red-600 transition-all hover:scale-105 shadow-[0_0_15px_rgba(220,38,38,0.5)]">Re-Deploy</button>
                     <button onClick={handleDownloadReport} className="px-8 py-4 bg-black hover:bg-gray-900 text-red-500 font-bold tracking-widest uppercase border border-red-900 transition-all hover:text-red-400 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Save Intel</button>
                 </div>
             </div>
        </div>
    );
};
const StatRow: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline border-b border-red-900/30 pb-1">
        <span className="text-red-800 text-sm font-bold tracking-wider">{label}</span>
        <span className="text-xl text-white font-mono">{value}</span>
    </div>
);
const TacticalCallInterface: React.FC<{ state: GameState, onIssueOrder: (o: AllyOrder) => void, onClose: () => void, t: any }> = ({ state, onIssueOrder, onClose, t }) => {
    return (
        <div className="absolute inset-0 z-[100] bg-cyan-900/90 pointer-events-auto font-mono flex items-center justify-center">
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
             <div className="w-[900px] h-[600px] bg-black/80 border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] flex relative overflow-hidden">
                 <CloseButton onClick={onClose} colorClass="border-cyan-500 text-cyan-500 hover:text-white hover:bg-cyan-900/50" />
                 <div className="w-1/3 border-r border-cyan-800 p-6 bg-cyan-950/20">
                     <h2 className="text-cyan-400 font-bold text-xl mb-6 tracking-widest border-b border-cyan-800 pb-2">{t('UNIT_STATUS')}</h2>
                     <div className="space-y-4">
                         {state.allies.length === 0 && <div className="text-cyan-700 italic">{t('NO_UNITS')}</div>}
                         {state.allies.map((ally, i) => (
                             <div key={ally.id} className="bg-black/40 p-3 border border-cyan-900/50">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-cyan-300 font-bold text-sm">UNIT-{i+1}</span>
                                     <span className={`text-[10px] px-2 py-0.5 rounded ${ally.state === 'COMBAT' ? 'bg-red-900/50 text-red-400' : 'bg-cyan-900/50 text-cyan-400'}`}>{ally.state}</span>
                                 </div>
                                 <div className="w-full bg-gray-900 h-1.5 mt-2"><div className="bg-cyan-500 h-full" style={{ width: `${(ally.hp / ally.maxHp) * 100}%` }}></div></div>
                             </div>
                         ))}
                     </div>
                     <div className="mt-8 pt-4 border-t border-cyan-800 text-xs text-cyan-600">{t('TOTAL_UNITS')}: {state.allies.length} / 5</div>
                 </div>
                 <div className="flex-1 p-10 flex flex-col justify-center items-center relative">
                     <h1 className="text-3xl font-black text-white tracking-[0.2em] mb-2 text-center drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">{t('TACTICAL_COMMAND')}</h1>
                     <p className="text-cyan-500 mb-12 text-sm tracking-widest">{t('PRIORITY_OVERRIDE')}</p>
                     <div className="grid grid-cols-1 gap-6 w-full max-w-md">
                         <button onClick={() => onIssueOrder('PATROL')} className="group relative h-20 bg-cyan-950/40 border border-cyan-600 hover:bg-cyan-600 hover:text-black transition-all overflow-hidden flex items-center px-6">
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-cyan-600 group-hover:bg-white"></div>
                             <div className="flex flex-col items-start ml-4"><span className="text-2xl font-bold tracking-tighter text-cyan-100 group-hover:text-black">{t('CMD_DEFEND')}</span><span className="text-xs text-cyan-400 group-hover:text-cyan-900">{t('CMD_DEFEND_DESC')}</span></div>
                             <div className="ml-auto text-4xl font-black text-cyan-800 group-hover:text-cyan-900 opacity-50">F1</div>
                         </button>
                         <button onClick={() => onIssueOrder('FOLLOW')} className="group relative h-20 bg-cyan-950/40 border border-cyan-600 hover:bg-cyan-600 hover:text-black transition-all overflow-hidden flex items-center px-6">
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-cyan-600 group-hover:bg-white"></div>
                             <div className="flex flex-col items-start ml-4"><span className="text-2xl font-bold tracking-tighter text-cyan-100 group-hover:text-black">{t('CMD_FOLLOW')}</span><span className="text-xs text-cyan-400 group-hover:text-cyan-900">{t('CMD_FOLLOW_DESC')}</span></div>
                             <div className="ml-auto text-4xl font-black text-cyan-800 group-hover:text-cyan-900 opacity-50">F2</div>
                         </button>
                         <button onClick={() => onIssueOrder('ATTACK')} className="group relative h-20 bg-cyan-950/40 border border-cyan-600 hover:bg-cyan-600 hover:text-black transition-all overflow-hidden flex items-center px-6">
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-cyan-600 group-hover:bg-white"></div>
                             <div className="flex flex-col items-start ml-4"><span className="text-2xl font-bold tracking-tighter text-cyan-100 group-hover:text-black">{t('CMD_ASSAULT')}</span><span className="text-xs text-cyan-400 group-hover:text-cyan-900">{t('CMD_ASSAULT_DESC')}</span></div>
                             <div className="ml-auto text-4xl font-black text-cyan-800 group-hover:text-cyan-900 opacity-50">F3</div>
                         </button>
                     </div>
                     <div className="absolute bottom-4 text-cyan-700 text-xs">{t('CLOSE_CHANNEL')}</div>
                 </div>
             </div>
        </div>
    )
}
const TacticalTerminal: React.FC<{ state: GameState, onToggleSetting: (k: keyof GameSettings) => void, onClose: () => void, onSave: () => void, t: any }> = ({ state, onToggleSetting, onClose, onSave, t }) => {
    const [activeTab, setActiveTab] = useState<'DATA' | 'CONFIG' | 'NOTES' | 'DATABASE' | 'PLANET' | 'MEMORY'>('DATA');
    const chartRef = useRef<SVGSVGElement>(null);
    const tabs = ['DATA', 'CONFIG', 'NOTES', 'DATABASE'];
    if (state.gameMode === GameMode.EXPLORATION) tabs.push('PLANET');
    tabs.push('MEMORY');

    useEffect(() => {
        if (activeTab === 'DATA' && chartRef.current) {
            const data = Object.entries(state.stats.killsByType).map(([type, count]) => ({ type, count }));
            const svg = d3.select(chartRef.current);
            svg.selectAll("*").remove();
            const margin = { top: 20, right: 20, bottom: 40, left: 40 };
            const width = 400 - margin.left - margin.right;
            const height = 250 - margin.top - margin.bottom;
            const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
            const x = d3.scaleBand().rangeRound([0, width]).padding(0.1).domain(data.map(d => d.type));
            const y = d3.scaleLinear().rangeRound([height, 0]).domain([0, d3.max(data, d => d.count) || 10]);
            g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("fill", "#10B981").attr("font-family", "monospace").attr("font-size", "10px");
            g.append("g").call(d3.axisLeft(y).ticks(5)).selectAll("text").attr("fill", "#10B981").attr("font-family", "monospace");
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

export default UIOverlay;
