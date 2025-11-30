import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GameState, WeaponType, EnemyType, GameSettings, AllyOrder, Player, TurretType, SpecialEventType, Enemy, BossType, AppMode, GameMode, Planet } from '../types';
import { PLAYER_STATS, SHOP_PRICES, WEAPONS, TURRET_COSTS, INVENTORY_SIZE, TURRET_STATS, TRANSLATIONS, BESTIARY_DB, ENEMY_STATS, BOSS_STATS } from '../constants';
import { drawGrunt, drawRusher, drawTank, drawKamikaze, drawViper, drawBossRed, drawBossBlue, drawBossPurple } from './GameCanvas';

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
    onDeselectPlanet
}) => {
  const p = state.player;
  const currentWeaponType = p.loadout[p.currentWeaponIndex];
  const currentWep = p.weapons[currentWeaponType];
  const wepStats = WEAPONS[currentWeaponType];
  const t = (key: keyof typeof TRANSLATIONS.EN) => TRANSLATIONS[state.settings.language][key];

  // --- MODE SPECIFIC UIs ---

  if (state.appMode === AppMode.START_MENU) {
      return (
          <div className="absolute inset-0 flex items-center justify-end pr-24 pointer-events-auto">
              <div className="flex flex-col items-end space-y-8">
                  <h1 className="text-8xl font-black text-white tracking-tighter drop-shadow-lg text-right">
                      BASE<br/><span className="text-blue-500">DEFENSE</span>
                  </h1>
                  <p className="text-gray-400 font-mono tracking-widest text-lg">TACTICAL SURVIVAL SIMULATION</p>
                  
                  <div className="h-16"></div>
                  
                  <button onClick={onStartSurvival} className="group relative w-96 h-24 bg-gray-900/80 border-2 border-white/20 hover:border-blue-500 hover:bg-blue-900/30 transition-all flex items-center justify-between px-8 overflow-hidden">
                      <div className="absolute inset-0 bg-blue-500/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                      <span className="relative z-10 text-3xl font-bold text-white tracking-widest group-hover:scale-105 transition-transform">SURVIVAL</span>
                      <span className="relative z-10 text-xs text-gray-500 group-hover:text-blue-300 font-mono uppercase">Endless Waves</span>
                  </button>

                  <button onClick={onStartExploration} className="group relative w-96 h-24 bg-gray-900/80 border-2 border-white/20 hover:border-purple-500 hover:bg-purple-900/30 transition-all flex items-center justify-between px-8 overflow-hidden">
                      <div className="absolute inset-0 bg-purple-500/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                      <span className="relative z-10 text-3xl font-bold text-white tracking-widest group-hover:scale-105 transition-transform">EXPLORE</span>
                      <span className="relative z-10 text-xs text-gray-500 group-hover:text-purple-300 font-mono uppercase">Campaign Mode</span>
                  </button>
              </div>
          </div>
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

              {planet && (
                  <div className="absolute top-1/2 right-12 -translate-y-1/2 w-96 bg-gray-900/90 border border-blue-500 p-8 pointer-events-auto backdrop-blur-md">
                      <CloseButton onClick={onDeselectPlanet} colorClass="border-blue-500 text-blue-500 hover:text-white hover:bg-blue-900/50" />
                      
                      <div className="flex justify-between items-start mb-6 mr-8">
                          <h2 className="text-3xl font-black text-white">{planet.name}</h2>
                          {planet.completed && <span className="bg-green-600 text-white text-xs px-2 py-1 font-bold">CLEARED</span>}
                      </div>
                      
                      <div className="space-y-6 font-mono text-sm">
                          <div>
                              <div className="text-gray-500 mb-1">THREAT LEVEL (WAVES)</div>
                              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${(planet.totalWaves / 40) * 100}%` }}></div>
                              </div>
                              <div className="text-right text-white mt-1">{planet.totalWaves} WAVES</div>
                          </div>

                          <div>
                              <div className="text-gray-500 mb-1">GENETIC MUTATION</div>
                              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${planet.geneStrength > 2 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${(planet.geneStrength / 3.2) * 100}%` }}></div>
                              </div>
                              <div className="text-right text-white mt-1">{planet.geneStrength.toFixed(1)}x HP</div>
                          </div>

                          <div className="border-t border-gray-700 pt-4 text-xs text-gray-400">
                              <p>Intel suggests heavy biological activity. Recommended loadout: High capacity magazines and crowd control explosives.</p>
                          </div>
                      </div>

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

  // GAME OVER / MISSION COMPLETE
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

  // Turret Upgrade Modal
  if (state.activeTurretId !== undefined) {
      return <TurretUpgradeUI state={state} onConfirmUpgrade={onConfirmUpgrade} />;
  }

  // Tactical Call Terminal (Ally Command)
  if (state.isTacticalMenuOpen) {
      return <TacticalCallInterface state={state} onIssueOrder={onIssueOrder} onClose={onCloseTacticalMenu} t={t} />;
  }

  // Tactical Backpack (Inventory)
  if (state.isInventoryOpen) {
      return <TacticalBackpack state={state} onSwapItems={onSwapItems} onClose={onCloseInventory} t={t} />;
  }

  // Pause Menu - Tactical Terminal (Stats & Settings)
  if (state.isPaused) {
      return <TacticalTerminal state={state} onToggleSetting={onToggleSetting} onClose={onClosePause} t={t} />;
  }

  // Format Time Remaining
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

      {/* --- TOP CENTER: WAVE INDICATOR --- */}
      {state.settings.showHUD && (
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
      )}

      {/* --- TOP RIGHT: SCRAPS --- */}
      {state.settings.showHUD && (
        <div className="absolute top-6 right-6">
          <div className="bg-black/60 px-6 py-3 rounded-xl border border-yellow-600/40 backdrop-blur-sm flex items-center gap-4 shadow-lg">
              <div className="flex flex-col items-end">
                  <span className="text-yellow-500 text-[10px] font-bold tracking-widest uppercase">{t('SCRAPS')}</span>
                  <span className="text-3xl font-mono font-bold text-white leading-none">{Math.floor(p.score)}</span>
              </div>
              <div className="text-yellow-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              </div>
          </div>
        </div>
      )}

      {/* --- BOTTOM LEFT: BASE STATUS --- */}
      {state.settings.showHUD && (
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
           
           {/* Backpack Hint */}
            <div className="mt-2 text-gray-500 text-xs font-mono">
                {t('CLOSE_BACKPACK').replace("CLOSE", "OPEN")}
            </div>
        </div>
      )}

      {/* --- BOTTOM RIGHT: WEAPON HUD --- */}
      {/* SCALED DOWN BY 50% using scale-50 and origin-bottom-right */}
      {state.settings.showHUD && (
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 scale-50 origin-bottom-right">
              
              {/* Main Info Panel */}
              <div className="bg-black/80 p-6 rounded-2xl border border-gray-700 backdrop-blur-md text-right min-w-[260px] shadow-2xl">
                  
                  {/* Header: Weapon Name */}
                  <div className="flex justify-between items-center mb-2">
                       <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest bg-gray-900 px-2 py-1 rounded">
                           {wepStats.name}
                       </div>
                       {currentWep.reloading && (
                           <span className="text-yellow-400 text-xs font-bold animate-pulse">RELOADING</span>
                       )}
                  </div>
                  
                  {/* Ammo Display */}
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
                  
                  {/* Divider */}
                  <div className="h-px bg-gradient-to-l from-gray-600 to-transparent w-full my-3"></div>

                  {/* Grenades */}
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

              {/* Weapon Switcher Strip */}
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

// --- Reusable Close Button ---
const CloseButton: React.FC<{ onClick: () => void, colorClass: string }> = ({ onClick, colorClass }) => (
    <button 
        onClick={onClick}
        className={`absolute top-3 right-3 z-50 p-2 border rounded transition-all duration-200 hover:scale-105 active:scale-95 ${colorClass}`}
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
    </button>
);


// --- Weapon Icons ---
const WeaponIcon: React.FC<{ type: WeaponType, className?: string }> = ({ type, className }) => {
    // Simple SVG paths for weapon silhouettes
    let path = "";
    switch(type) {
        case WeaponType.AR: 
            path = "M2 12h4l2-2h10l2 2h2v4h-6v4h-4v-4H4v4H2v-8z M12 10h6v2h-6z"; 
            break;
        case WeaponType.SG: 
            path = "M2 14h2v2h4v-2h12v-4H2v4z"; 
            break;
        case WeaponType.SR: 
            path = "M2 12h4v-2h16v4h-2v2h-4v-2H6v2H2v-4z M10 8h8v2h-8z"; 
            break;
        case WeaponType.PISTOL: 
            path = "M4 10h12v4H8v6H4v-10z"; 
            break;
        case WeaponType.FLAMETHROWER:
            path = "M2 10h6v-2h2v-2h2v2h2v2h6v4H12v2H2v-6z M4 12h2v2H4z";
            break;
        case WeaponType.PULSE_RIFLE:
            path = "M2 8h16l4 4v4H10v-2H6v2H2V8z M4 10h12v2H4z";
            break;
        case WeaponType.GRENADE_LAUNCHER:
            path = "M2 12h4v-2h4v-2h8v8h-8v-2H6v2H2v-4z";
            break;
    }
    
    return (
        <svg viewBox="0 0 24 24" className={className}>
            <path d={path} />
        </svg>
    );
};

// --- Turret Upgrade UI ---
const TurretUpgradeUI: React.FC<{ state: GameState, onConfirmUpgrade: (type: TurretType) => void }> = ({ state, onConfirmUpgrade }) => {
    const p = state.player;

    return (
        <div className="absolute inset-0 z-[100] bg-gray-900/90 pointer-events-auto flex items-center justify-center font-mono">
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,0,0,0)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
             
             <div className="max-w-6xl w-full p-8 relative">
                 <h1 className="text-4xl font-black text-center text-white mb-2 tracking-[0.2em]">SYSTEM UPGRADE DETECTED</h1>
                 <p className="text-center text-emerald-500 mb-12 tracking-widest">SELECT COMBAT CONFIGURATION</p>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     
                     {/* Option A: Gauss/Machine Gun */}
                     <UpgradeCard 
                        title="HEAVY GAUSS"
                        type="ASSAULT CLASS"
                        desc="Advanced rotary cannon. High rate of fire with improved kinetic impact."
                        stats={{ dmg: 90, range: 650, rate: '100ms' }}
                        cost={TURRET_COSTS.upgrade_gauss}
                        color="emerald"
                        canAfford={p.score >= TURRET_COSTS.upgrade_gauss}
                        onClick={() => onConfirmUpgrade(TurretType.GAUSS)}
                     />

                     {/* Option B: Sniper */}
                     <UpgradeCard 
                        title="RAIL CANNON"
                        type="PRECISION CLASS"
                        desc="Long-range hypervelocity projectile. Eliminates high-value targets."
                        stats={{ dmg: 140, range: 1300, rate: '250ms' }}
                        cost={TURRET_COSTS.upgrade_sniper}
                        color="yellow"
                        canAfford={p.score >= TURRET_COSTS.upgrade_sniper}
                        onClick={() => onConfirmUpgrade(TurretType.SNIPER)}
                     />

                     {/* Option C: Missile */}
                     <UpgradeCard 
                        title="WAR COMMAND"
                        type="SUPPORT CLASS"
                        desc="Global range VLS system. Launches homing missiles at threats nearest to base."
                        stats={{ dmg: 160, range: 'GLOBAL', rate: '840ms' }}
                        cost={TURRET_COSTS.upgrade_missile}
                        color="red"
                        canAfford={p.score >= TURRET_COSTS.upgrade_missile}
                        onClick={() => onConfirmUpgrade(TurretType.MISSILE)}
                     />

                 </div>
             </div>
        </div>
    );
};

const UpgradeCard: React.FC<{ 
    title: string, type: string, desc: string, stats: any, cost: number, color: 'emerald'|'yellow'|'red', canAfford: boolean, onClick: () => void 
}> = ({ title, type, desc, stats, cost, color, canAfford, onClick }) => {
    
    const colorClasses = {
        emerald: 'border-emerald-600 text-emerald-400 hover:bg-emerald-900/20',
        yellow: 'border-yellow-600 text-yellow-400 hover:bg-yellow-900/20',
        red: 'border-red-600 text-red-400 hover:bg-red-900/20'
    };

    const btnClasses = {
         emerald: 'bg-emerald-600 hover:bg-emerald-500 text-black',
         yellow: 'bg-yellow-600 hover:bg-yellow-500 text-black',
         red: 'bg-red-600 hover:bg-red-500 text-white'
    };

    return (
        <div className={`bg-black/80 border-2 p-6 flex flex-col relative group transition-all duration-300 ${colorClasses[color]} ${!canAfford ? 'opacity-50 grayscale' : ''}`}>
             <div className="absolute top-0 right-0 p-2 text-xs font-bold border-l-2 border-b-2 border-inherit bg-black/50">{type}</div>
             
             <h2 className="text-2xl font-bold mb-4 mt-2">{title}</h2>
             <div className="h-px w-full bg-current opacity-30 mb-4"></div>
             
             <p className="text-gray-300 text-sm mb-6 h-16">{desc}</p>
             
             <div className="space-y-2 mb-8 text-sm font-mono">
                 <div className="flex justify-between"><span>DAMAGE OUTPUT</span><span className="text-white">{stats.dmg}</span></div>
                 <div className="flex justify-between"><span>EFFECTIVE RNG</span><span className="text-white">{stats.range}</span></div>
                 <div className="flex justify-between"><span>CYCLE RATE</span><span className="text-white">{stats.rate}</span></div>
             </div>

             <div className="mt-auto">
                 <button 
                    disabled={!canAfford}
                    onClick={onClick}
                    className={`w-full py-4 font-bold tracking-widest text-lg uppercase transition-all ${canAfford ? btnClasses[color] : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                 >
                     {canAfford ? `INSTALL - ${cost}` : `NEED ${cost} SCRAPS`}
                 </button>
             </div>
        </div>
    );
};

// --- Shop Modal Component ---
const ShopModal: React.FC<{ state: GameState, onPurchase: (item: string) => void, onClose: () => void, t: any }> = ({ state, onPurchase, onClose, t }) => {
    const p = state.player;
    const [activeTab, setActiveTab] = useState<'AMMO' | 'WEAPONS'>('AMMO');

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
                    <button 
                        onClick={() => setActiveTab('AMMO')}
                        className={`flex-1 py-3 text-center font-bold tracking-wider rounded-t-lg transition-colors border-b-2 
                            ${activeTab === 'AMMO' 
                            ? 'bg-gray-800 text-yellow-400 border-yellow-500' 
                            : 'bg-gray-900 text-gray-500 border-gray-700 hover:text-gray-300'}`}
                    >
                        {t('TAB_AMMO')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('WEAPONS')}
                        className={`flex-1 py-3 text-center font-bold tracking-wider rounded-t-lg transition-colors border-b-2 
                            ${activeTab === 'WEAPONS' 
                            ? 'bg-gray-800 text-yellow-400 border-yellow-500' 
                            : 'bg-gray-900 text-gray-500 border-gray-700 hover:text-gray-300'}`}
                    >
                        {t('TAB_WEAPONS')}
                    </button>
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
               </div>
           </div>
        </div>
    );
};

// --- Tactical Backpack Component ---
const TacticalBackpack: React.FC<{ state: GameState, onSwapItems: (lIdx: number, iIdx: number) => void, onClose: () => void, t: any }> = ({ state, onSwapItems, onClose, t }) => {
    const p = state.player;
    const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);

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
                        <div className="flex items-center gap-4 text-white">
                            <div className="w-12 h-12 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                                <div className="w-4 h-6 bg-orange-500 rounded-sm"></div>
                            </div>
                            <div>
                                <div className="font-bold">{t('GRENADE')}</div>
                                <div className="text-xs text-gray-400">x{p.grenades}</div>
                            </div>
                        </div>
                     </div>
                </div>

                {/* Right Column: Loadout & Inventory */}
                <div className="flex-1 flex flex-col gap-6">
                    
                    {/* Loadout Section */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2 tracking-wide border-b border-gray-600 pb-2">{t('LOADOUT_HEADER')}</h2>
                        <p className="text-xs text-gray-500 mb-4">{t('LOADOUT_HINT')}</p>
                        <div className="flex gap-4">
                            {p.loadout.map((wType, idx) => (
                                <div 
                                    key={idx}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    onDragOver={handleDragOver}
                                    className="relative w-32 h-32 bg-black/40 border-2 border-dashed border-gray-600 rounded flex flex-col items-center justify-center group hover:border-blue-500 transition-colors"
                                >
                                    <div className="absolute top-1 left-2 text-xs text-gray-600 font-bold">{t('SLOT')} {idx+1}</div>
                                    <WeaponIcon type={wType} className="w-16 h-16 fill-gray-400 group-hover:fill-blue-400" />
                                    <div className="text-xs font-bold text-white text-center px-1 mt-2">{WEAPONS[wType].name}</div>
                                    <div className="text-[10px] text-gray-400">{idx === 3 ? t('SLOT_SIDEARM') : t('SLOT_MAIN')}</div>
                                </div>
                            ))}
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


// --- Mission Failed Screen ---
const MissionFailedScreen: React.FC<{ state: GameState, onRestart: () => void }> = ({ state, onRestart }) => {
    
    const handleDownloadReport = () => {
        // Create an offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 800, 600);

        // Grid lines
        ctx.strokeStyle = '#331111';
        ctx.lineWidth = 1;
        for (let i = 0; i < 800; i += 40) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
        }
        for (let i = 0; i < 600; i += 40) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
        }

        // Header
        ctx.fillStyle = '#b91c1c'; // Red 700
        ctx.font = 'bold 60px Courier New, monospace';
        ctx.fillText('MISSION FAILED', 50, 80);

        ctx.fillStyle = '#7f1d1d'; 
        ctx.font = '20px Courier New, monospace';
        ctx.fillText('// AFTER ACTION REPORT // CLASSIFIED', 50, 110);
        ctx.fillText(`// DATE: ${new Date().toLocaleDateString()}`, 50, 135);

        // Border
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#b91c1c';
        ctx.strokeRect(20, 20, 760, 560);

        // Stats Column 1
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Courier New, monospace';
        
        const drawStat = (label: string, value: string | number, x: number, y: number) => {
            ctx.fillStyle = '#9ca3af'; // Gray
            ctx.fillText(label, x, y);
            ctx.fillStyle = '#ffffff'; // White
            ctx.fillText(String(value), x + 250, y);
        };

        let y = 200;
        drawStat('WAVES SURVIVED', state.wave, 50, y); y += 40;
        drawStat('TOTAL SCORE', Math.floor(state.player.score), 50, y); y += 40;
        drawStat('DAMAGE DEALT', state.stats.damageDealt.toLocaleString(), 50, y); y += 40;
        drawStat('SHOTS FIRED', state.stats.shotsFired.toLocaleString(), 50, y); y += 40;
        const accuracy = state.stats.shotsFired > 0 ? ((state.stats.shotsHit / state.stats.shotsFired) * 100).toFixed(1) + '%' : '0%';
        drawStat('ACCURACY', accuracy, 50, y); y += 40;

        // Stats Column 2 (Kills)
        y = 200;
        const x2 = 450;
        ctx.fillStyle = '#ef4444';
        ctx.fillText('CONFIRMED KILLS', x2, y - 10);
        
        ctx.font = '18px Courier New, monospace';
        Object.entries(state.stats.killsByType).forEach(([type, count], idx) => {
            ctx.fillStyle = '#9ca3af';
            ctx.fillText(type, x2, y + 30 + (idx * 30));
            ctx.fillStyle = '#ef4444';
            ctx.fillText(String(count), x2 + 200, y + 30 + (idx * 30));
        });

        // Watermark
        ctx.fillStyle = '#331111';
        ctx.font = 'bold 100px Arial';
        ctx.save();
        ctx.translate(400, 300);
        ctx.rotate(-Math.PI / 6);
        ctx.textAlign = 'center';
        ctx.fillText('TERMINATED', 0, 0);
        ctx.restore();

        // Convert to image and download
        const image = canvas.toDataURL("image/jpeg");
        const link = document.createElement('a');
        link.href = image;
        link.download = `MissionReport_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center pointer-events-auto font-mono text-red-600">
             {/* Background Effects */}
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
                     <button 
                        onClick={onRestart}
                        className="px-8 py-4 bg-red-900 hover:bg-red-800 text-white font-bold tracking-widest uppercase border border-red-600 transition-all hover:scale-105 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                     >
                         Re-Deploy
                     </button>
                     <button 
                        onClick={handleDownloadReport}
                        className="px-8 py-4 bg-black hover:bg-gray-900 text-red-500 font-bold tracking-widest uppercase border border-red-900 transition-all hover:text-red-400 flex items-center gap-2"
                     >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                         </svg>
                         Save Intel
                     </button>
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

// --- Tactical Call Interface (Blue Theme) ---
const TacticalCallInterface: React.FC<{ state: GameState, onIssueOrder: (o: AllyOrder) => void, onClose: () => void, t: any }> = ({ state, onIssueOrder, onClose, t }) => {
    return (
        <div className="absolute inset-0 z-[100] bg-cyan-900/90 pointer-events-auto font-mono flex items-center justify-center">
             {/* Grid BG */}
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
             
             <div className="w-[900px] h-[600px] bg-black/80 border-2 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)] flex relative overflow-hidden">
                 
                 {/* Close Button */}
                 <CloseButton onClick={onClose} colorClass="border-cyan-500 text-cyan-500 hover:text-white hover:bg-cyan-900/50" />

                 {/* Left Panel: Unit Status */}
                 <div className="w-1/3 border-r border-cyan-800 p-6 bg-cyan-950/20">
                     <h2 className="text-cyan-400 font-bold text-xl mb-6 tracking-widest border-b border-cyan-800 pb-2">{t('UNIT_STATUS')}</h2>
                     <div className="space-y-4">
                         {state.allies.length === 0 && <div className="text-cyan-700 italic">{t('NO_UNITS')}</div>}
                         {state.allies.map((ally, i) => (
                             <div key={ally.id} className="bg-black/40 p-3 border border-cyan-900/50">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-cyan-300 font-bold text-sm">UNIT-{i+1}</span>
                                     <span className={`text-[10px] px-2 py-0.5 rounded ${ally.state === 'COMBAT' ? 'bg-red-900/50 text-red-400' : 'bg-cyan-900/50 text-cyan-400'}`}>
                                         {ally.state}
                                     </span>
                                 </div>
                                 <div className="w-full bg-gray-900 h-1.5 mt-2">
                                     <div className="bg-cyan-500 h-full" style={{ width: `${(ally.hp / ally.maxHp) * 100}%` }}></div>
                                 </div>
                             </div>
                         ))}
                     </div>
                     <div className="mt-8 pt-4 border-t border-cyan-800 text-xs text-cyan-600">
                         {t('TOTAL_UNITS')}: {state.allies.length} / 5
                     </div>
                 </div>

                 {/* Right Panel: Commands */}
                 <div className="flex-1 p-10 flex flex-col justify-center items-center relative">
                     <h1 className="text-3xl font-black text-white tracking-[0.2em] mb-2 text-center drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">{t('TACTICAL_COMMAND')}</h1>
                     <p className="text-cyan-500 mb-12 text-sm tracking-widest">{t('PRIORITY_OVERRIDE')}</p>

                     <div className="grid grid-cols-1 gap-6 w-full max-w-md">
                         <button 
                            onClick={() => onIssueOrder('PATROL')}
                            className="group relative h-20 bg-cyan-950/40 border border-cyan-600 hover:bg-cyan-600 hover:text-black transition-all overflow-hidden flex items-center px-6"
                         >
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-cyan-600 group-hover:bg-white"></div>
                             <div className="flex flex-col items-start ml-4">
                                 <span className="text-2xl font-bold tracking-tighter text-cyan-100 group-hover:text-black">{t('CMD_DEFEND')}</span>
                                 <span className="text-xs text-cyan-400 group-hover:text-cyan-900">{t('CMD_DEFEND_DESC')}</span>
                             </div>
                             <div className="ml-auto text-4xl font-black text-cyan-800 group-hover:text-cyan-900 opacity-50">F1</div>
                         </button>

                         <button 
                            onClick={() => onIssueOrder('FOLLOW')}
                            className="group relative h-20 bg-cyan-950/40 border border-cyan-600 hover:bg-cyan-600 hover:text-black transition-all overflow-hidden flex items-center px-6"
                         >
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-cyan-600 group-hover:bg-white"></div>
                             <div className="flex flex-col items-start ml-4">
                                 <span className="text-2xl font-bold tracking-tighter text-cyan-100 group-hover:text-black">{t('CMD_FOLLOW')}</span>
                                 <span className="text-xs text-cyan-400 group-hover:text-cyan-900">{t('CMD_FOLLOW_DESC')}</span>
                             </div>
                             <div className="ml-auto text-4xl font-black text-cyan-800 group-hover:text-cyan-900 opacity-50">F2</div>
                         </button>

                         <button 
                            onClick={() => onIssueOrder('ATTACK')}
                            className="group relative h-20 bg-cyan-950/40 border border-cyan-600 hover:bg-cyan-600 hover:text-black transition-all overflow-hidden flex items-center px-6"
                         >
                             <div className="absolute left-0 top-0 bottom-0 w-2 bg-cyan-600 group-hover:bg-white"></div>
                             <div className="flex flex-col items-start ml-4">
                                 <span className="text-2xl font-bold tracking-tighter text-cyan-100 group-hover:text-black">{t('CMD_ASSAULT')}</span>
                                 <span className="text-xs text-cyan-400 group-hover:text-cyan-900">{t('CMD_ASSAULT_DESC')}</span>
                             </div>
                             <div className="ml-auto text-4xl font-black text-cyan-800 group-hover:text-cyan-900 opacity-50">F3</div>
                         </button>
                     </div>

                     <div className="absolute bottom-4 text-cyan-700 text-xs">
                         {t('CLOSE_CHANNEL')}
                     </div>
                 </div>
             </div>
        </div>
    )
}

// --- Tactical Terminal Component (Green Theme - Stats) ---
const TacticalTerminal: React.FC<{ state: GameState, onToggleSetting: (k: keyof GameSettings) => void, onClose: () => void, t: any }> = ({ state, onToggleSetting, onClose, t }) => {
    const [activeTab, setActiveTab] = useState<'DATA' | 'CONFIG' | 'NOTES' | 'DATABASE'>('DATA');
    const chartRef = useRef<SVGSVGElement>(null);

    // D3 Chart for Kill Stats
    useEffect(() => {
        if (activeTab === 'DATA' && chartRef.current) {
            const data = Object.entries(state.stats.killsByType).map(([type, count]) => ({ type, count }));
            const svg = d3.select(chartRef.current);
            svg.selectAll("*").remove();

            const margin = { top: 20, right: 20, bottom: 40, left: 40 };
            const width = 400 - margin.left - margin.right;
            const height = 250 - margin.top - margin.bottom;

            const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleBand()
                .rangeRound([0, width])
                .padding(0.1)
                .domain(data.map(d => d.type));

            const y = d3.scaleLinear()
                .rangeRound([height, 0])
                .domain([0, d3.max(data, d => d.count) || 10]);

            g.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("fill", "#10B981")
                .attr("font-family", "monospace")
                .attr("font-size", "10px");

            g.append("g")
                .call(d3.axisLeft(y).ticks(5))
                .selectAll("text")
                .attr("fill", "#10B981")
                .attr("font-family", "monospace");
            
            // Axis Lines
            g.selectAll("path, line").attr("stroke", "#065F46");

            g.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.type)!)
                .attr("y", d => y(d.count))
                .attr("width", x.bandwidth())
                .attr("height", d => height - y(d.count))
                .attr("fill", "#10B981")
                .attr("opacity", 0.8);
        }
    }, [activeTab, state.stats.killsByType]);

    const accuracy = state.stats.shotsFired > 0 
        ? ((state.stats.shotsHit / state.stats.shotsFired) * 100).toFixed(1) 
        : "0.0";

    return (
        <div className="absolute inset-0 z-[100] bg-black pointer-events-auto font-mono text-green-500 flex items-center justify-center">
            {/* Scanlines Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
            
            <div className="w-[900px] h-[600px] border-2 border-green-800 bg-gray-900/90 relative shadow-[0_0_20px_rgba(16,185,129,0.2)] flex flex-col">
                
                {/* Close Button */}
                <CloseButton onClick={onClose} colorClass="border-green-800 text-green-500 hover:text-white hover:bg-green-900/50" />

                {/* Header */}
                <div className="border-b border-green-800 p-4 flex justify-between items-center bg-black/50">
                    <h1 className="text-2xl font-bold tracking-widest text-green-400">{t('PAUSE_TITLE')}</h1>
                    <div className="text-xs text-green-700 animate-pulse mr-8">{t('SYSTEM_PAUSED')}</div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-green-800">
                    {['DATA', 'CONFIG', 'NOTES', 'DATABASE'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-3 text-center transition-colors font-bold tracking-wider
                                ${activeTab === tab 
                                    ? 'bg-green-900/30 text-green-300 shadow-[inset_0_-2px_0_#34D399]' 
                                    : 'text-green-800 hover:bg-green-900/10 hover:text-green-600'}
                            `}
                        >
                            {t(`TAB_${tab}`)}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'DATA' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="border border-green-900 p-4 bg-black/40">
                                    <div className="text-green-700 text-xs uppercase mb-1">{t('TOTAL_DAMAGE')}</div>
                                    <div className="text-2xl text-green-300">{state.stats.damageDealt.toLocaleString()}</div>
                                </div>
                                <div className="border border-green-900 p-4 bg-black/40">
                                    <div className="text-green-700 text-xs uppercase mb-1">{t('SHOTS_FIRED')}</div>
                                    <div className="text-2xl text-green-300">{state.stats.shotsFired.toLocaleString()}</div>
                                </div>
                                <div className="border border-green-900 p-4 bg-black/40">
                                    <div className="text-green-700 text-xs uppercase mb-1">{t('ACCURACY')}</div>
                                    <div className="text-2xl text-green-300">{accuracy}%</div>
                                </div>
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
                            
                            <ToggleRow 
                                label={t('HUD_OVERLAY')} 
                                active={state.settings.showHUD} 
                                onClick={() => onToggleSetting('showHUD')} 
                            />
                            <ToggleRow 
                                label={t('GORE')} 
                                active={state.settings.showBlood} 
                                onClick={() => onToggleSetting('showBlood')} 
                            />
                            <ToggleRow 
                                label={t('DMG_TEXT')} 
                                active={state.settings.showDamageNumbers} 
                                onClick={() => onToggleSetting('showDamageNumbers')} 
                            />
                            <ToggleRow 
                                label={`${t('LANGUAGE')} : ${state.settings.language}`}
                                active={state.settings.language === 'EN'} // Just visual state
                                onClick={() => onToggleSetting('language')} 
                            />
                        </div>
                    )}

                    {activeTab === 'NOTES' && (
                        <div className="text-green-600 text-sm space-y-4 font-mono leading-relaxed">
                            <p className="text-green-400 font-bold">[MISSION BRIEFING]</p>
                            <p>Defend the outpost against indigenous xenomorph lifeforms. The base integrity must be maintained at all costs.</p>
                            
                            <p className="text-green-400 font-bold mt-6">[WEAPONRY]</p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong className="text-green-500">AR (Assault Rifle):</strong> Standard issue. Reliable damage and fire rate.</li>
                                <li><strong className="text-green-500">SG (Shotgun):</strong> High impact at close quarters. Wide spread.</li>
                                <li><strong className="text-green-500">SR (Sniper):</strong> Precision elimination. High recoil.</li>
                                <li><strong className="text-green-500">PISTOL:</strong> Backup sidearm. Infinite ammo.</li>
                            </ul>

                            <p className="text-green-400 font-bold mt-6">[TACTICS]</p>
                            <p>Use [E] near base to access supply depot. Use [E] to construct automated defense turrets. Press [P] to access this terminal.</p>
                        </div>
                    )}

                    {activeTab === 'DATABASE' && <BestiaryPanel state={state} t={t} />}
                </div>

                <div className="p-2 border-t border-green-900 text-center text-xs text-green-800">
                    {t('RESUME_HINT')}
                </div>
            </div>
        </div>
    );
};

const BestiaryPanel: React.FC<{ state: GameState, t: any }> = ({ state, t }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // List of all possible enemies (IDs)
    const allEntities = [
        EnemyType.GRUNT, EnemyType.RUSHER, EnemyType.VIPER, EnemyType.TANK, EnemyType.KAMIKAZE,
        BossType.RED_SUMMONER, BossType.BLUE_BURST, BossType.PURPLE_ACID
    ];

    const isDiscovered = (id: string) => state.stats.encounteredEnemies.includes(id);

    useEffect(() => {
        if (selectedId && isDiscovered(selectedId) && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            
            // Clear
            ctx.clearRect(0, 0, 200, 200);
            
            // Draw Center background
            ctx.fillStyle = '#022c22'; // Dark green bg
            ctx.fillRect(0,0,200,200);
            ctx.strokeStyle = '#065f46';
            ctx.strokeRect(0,0,200,200);

            // Mock Entity for drawing
            const mockEntity: any = {
                x: 100,
                y: 100,
                radius: 30, // Default scaled up
                angle: -Math.PI / 2, // Face up
                hp: 100,
                maxHp: 100,
                color: '#fff',
                // Add specific type props so the draw function works
                type: selectedId,
                bossType: selectedId, 
                isBoss: selectedId.includes('BOSS') || selectedId.includes('SUMMONER') || selectedId.includes('BURST') || selectedId.includes('ACID')
            };

            // Inject Radius from stats
            if (ENEMY_STATS[selectedId as EnemyType]) mockEntity.radius = ENEMY_STATS[selectedId as EnemyType].radius * 2;
            if (BOSS_STATS[selectedId as BossType]) mockEntity.radius = BOSS_STATS[selectedId as BossType].radius * 1.5;

            ctx.save();
            ctx.translate(100, 100);
            ctx.scale(1.5, 1.5); // Zoom in
            ctx.translate(-100, -100);

            // Call specific draw function
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
            {/* Left List */}
            <div className="w-1/3 border-r border-green-800 pr-2 overflow-y-auto">
                {allEntities.map(id => {
                    const discovered = isDiscovered(id);
                    return (
                        <div 
                            key={id}
                            onClick={() => setSelectedId(id)}
                            className={`p-3 mb-2 cursor-pointer border transition-colors flex justify-between items-center
                                ${selectedId === id ? 'bg-green-900 border-green-500 text-white' : 'bg-black/40 border-green-900/50 text-green-700 hover:bg-green-900/20'}
                            `}
                        >
                            <span className="font-bold text-xs tracking-widest">
                                {discovered ? (BESTIARY_DB[id]?.codeName || id) : 'UNKNOWN SIGNAL'}
                            </span>
                            {!discovered && <span className="text-[10px] text-green-900 bg-green-900/20 px-1">LOCKED</span>}
                        </div>
                    );
                })}
            </div>

            {/* Right Details */}
            <div className="flex-1 pl-2">
                {selectedId ? (
                    isDiscovered(selectedId) ? (
                        <div className="h-full flex flex-col animate-fadeIn">
                            <div className="flex gap-4 mb-4">
                                <div className="border border-green-700 w-[200px] h-[200px] bg-black relative">
                                    <canvas ref={canvasRef} width={200} height={200} className="w-full h-full" />
                                    {/* Scanline overlay on canvas */}
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
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
                        <div className="h-full flex flex-col items-center justify-center text-green-800 space-y-4">
                            <div className="text-6xl opacity-20">?</div>
                            <div className="text-xl font-bold">{t('BESTIARY_LOCKED')}</div>
                            <p className="text-xs max-w-xs text-center">{t('BESTIARY_HINT')}</p>
                        </div>
                    )
                ) : (
                    <div className="h-full flex items-center justify-center text-green-900 italic">
                        SELECT A TARGET FROM THE INDEX
                    </div>
                )}
            </div>
        </div>
    );
};

const ToggleRow: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
    <div className="flex items-center justify-between p-3 border border-green-900/50 hover:bg-green-900/20 cursor-pointer" onClick={onClick}>
        <span>{label}</span>
        <div className={`w-12 h-6 rounded-none border border-green-700 relative transition-colors ${active ? 'bg-green-900' : 'bg-black'}`}>
            <div className={`absolute top-0.5 bottom-0.5 w-5 bg-green-500 transition-all ${active ? 'left-[calc(100%-22px)]' : 'left-0.5'}`}></div>
        </div>
    </div>
);


interface ShopItemProps { 
    name: string; 
    amount?: string;
    cost: number; 
    canAfford: boolean; 
    disabled?: boolean; 
    highlight?: boolean;
    onClick: () => void 
}

const ShopItem: React.FC<ShopItemProps> = ({ name, amount, cost, canAfford, disabled, highlight, onClick }) => (
    <button 
      onClick={onClick}
      disabled={!canAfford || disabled}
      className={`p-5 rounded-xl border flex justify-between items-center transition-all group relative overflow-hidden
        ${disabled ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed opacity-60' : 
          canAfford ? (highlight ? 'bg-gray-800 border-cyan-600 hover:border-cyan-400 text-white' : 'bg-gray-800 border-gray-600 hover:border-yellow-500 text-white') : 'bg-gray-800 border-red-900/30 text-gray-500 cursor-not-allowed'}
      `}
    >
        <div className="flex flex-col items-start z-10">
            <span className={`font-bold text-lg ${highlight ? 'text-cyan-200' : ''}`}>{name}</span>
            {amount && <span className="text-xs text-gray-400 group-hover:text-gray-300">{amount}</span>}
        </div>
        <div className="flex flex-col items-end z-10">
             <span className={`text-xl font-mono font-bold ${canAfford && !disabled ? "text-yellow-400 group-hover:text-yellow-300" : ""}`}>{cost}</span>
             <span className="text-[10px] uppercase tracking-wider">Scraps</span>
        </div>
        
        {/* Hover effect bg */}
        {canAfford && !disabled && (
            <div className={`absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${highlight ? 'bg-cyan-500/10' : 'bg-yellow-500/5'}`}></div>
        )}
    </button>
);

const InteractPrompt: React.FC<{ state: GameState }> = ({ state }) => {
    // Only show in gameplay
    if (state.appMode !== AppMode.GAMEPLAY) return null;

    const p = state.player;
    
    // Check Shop
    const distToShop = Math.sqrt(Math.pow(p.x - state.base.x, 2) + Math.pow(p.y - state.base.y, 2));
    if (distToShop < 300 && !state.isShopOpen) {
        return (
            <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                <div className="bg-yellow-500 text-black font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">
                    OPEN SHOP [B]
                </div>
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-yellow-500 border-r-[8px] border-r-transparent mt-[-1px]"></div>
            </div>
        )
    }

    // Check Turrets
    let nearTurret = false;
    let closestSpotIdx = -1;
    let minDist = 60; // range

    state.turretSpots.forEach((t, idx) => {
        const d = Math.sqrt(Math.pow(p.x - t.x, 2) + Math.pow(p.y - t.y, 2));
        if (d < minDist) {
             nearTurret = true;
             closestSpotIdx = idx;
        }
    });

    if (nearTurret && closestSpotIdx !== -1) {
        const spot = state.turretSpots[closestSpotIdx];
        
        if (spot.builtTurret) {
             // Upgrade Logic
             return (
                <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                    <div className="bg-emerald-500 text-white font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">
                        UPGRADE [E]
                    </div>
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-emerald-500 border-r-[8px] border-r-transparent mt-[-1px]"></div>
                </div>
            );
        } else {
             // Build Logic
             const currentCount = state.turretSpots.filter(s => s.builtTurret).length;
             const cost = TURRET_COSTS.baseCost + (currentCount * TURRET_COSTS.costIncrement);

             return (
                <div className="absolute top-2/3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                    <div className="bg-blue-600 text-white font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white">
                        BUILD [E] - {cost}
                    </div>
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-blue-600 border-r-[8px] border-r-transparent mt-[-1px]"></div>
                </div>
            );
        }
    }

    return null;
}

export default UIOverlay;