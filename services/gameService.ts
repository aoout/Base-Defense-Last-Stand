
import {
  GameState,
  InputState,
  WeaponType,
  EnemyType,
  Enemy,
  Projectile,
  Turret,
  Ally,
  WeaponState,
  Entity,
  TerrainFeature,
  BloodStain,
  GameStats,
  AllyOrder,
  InventoryItem,
  TurretType,
  SpecialEventType,
  BossType,
  AppMode,
  GameMode,
  Planet,
  PersistentPlayerState,
  SaveFile,
  DefenseUpgradeType,
  ModuleType,
  WeaponModule,
  AtmosphereGas,
  SpaceshipModuleType,
  PlanetVisualType
} from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  INVENTORY_SIZE,
  MAX_SAVE_SLOTS,
  MAX_PINNED_SLOTS,
} from '../constants';
import {
  PLAYER_STATS,
  WEAPONS,
  INITIAL_AMMO,
  ENEMY_STATS,
  BASE_STATS,
  TURRET_COSTS,
  TURRET_STATS,
  ALLY_STATS,
  SHOP_PRICES,
  BOSS_STATS,
  TOXIC_ZONE_STATS,
  DEFENSE_UPGRADE_INFO,
  MODULE_STATS,
  SPACESHIP_MODULES
} from '../data/registry';
import { AudioService } from './audioService';
import { generatePlanets, generateTerrain } from '../utils/worldGenerator';
import { calculateEnemyStats, selectEnemyType } from '../utils/enemyUtils';

const TURRET_POSITIONS = [
  { x: -150, y: -150 },
  { x: 150, y: -150 },
  { x: -250, y: -100 },
  { x: 250, y: -100 },
  { x: 0, y: -250 },
  { x: -350, y: -300 },
  { x: 350, y: -300 },
  { x: 0, y: -450 },
];

export class GameEngine {
  state!: GameState;
  input: InputState;
  audio: AudioService;
  private lastTime: number = 0;
  private storageKey = 'BASE_DEFENSE_SAVES_V1';

  constructor() {
    this.input = {
      keys: {},
      mouse: { x: 0, y: 0, down: false, rightDown: false },
    };
    this.audio = new AudioService();
    this.reset(true); // Initial full reset
    
    // Override defaults for Startup
    this.state.appMode = AppMode.START_MENU;
    
    // Load saves
    this.state.saveSlots = this.loadSavesFromStorage();
  }

  public handleInput(key: string, isDown: boolean) {
      this.input.keys[key] = isDown;

      if (isDown && this.state.appMode === AppMode.GAMEPLAY) {
          // Weapon Switching
          if (key === '1') this.switchWeapon(0);
          if (key === '2') this.switchWeapon(1);
          if (key === '3') this.switchWeapon(2);
          if (key === '4') this.switchWeapon(3);

          // Tactical Menu (Tab)
          if (key === 'Tab') {
              if (!this.state.isPaused && !this.state.isShopOpen && !this.state.isInventoryOpen) {
                  this.toggleTacticalMenu();
              }
          }

          // Tactical Commands Hotkeys (When menu is open)
          if (this.state.isTacticalMenuOpen) {
              if (key === 'F1') { this.issueOrder('PATROL'); this.toggleTacticalMenu(); }
              if (key === 'F2') { this.issueOrder('FOLLOW'); this.toggleTacticalMenu(); }
              if (key === 'F3') { this.issueOrder('ATTACK'); this.toggleTacticalMenu(); }
          }

          // Inventory / Backpack (C)
          if (key === 'c' || key === 'C') {
              if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isShopOpen) {
                  this.toggleInventory();
              }
          }

          // Shop (B)
          if (key === 'b' || key === 'B') {
              if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen) {
                  const p = this.state.player;
                  const dist = Math.sqrt(Math.pow(p.x - this.state.base.x, 2) + Math.pow(p.y - this.state.base.y, 2));
                  
                  if (dist < 300 || this.state.isShopOpen) {
                      this.state.isShopOpen = !this.state.isShopOpen;
                  }
              }
          }

          // Interact (E)
          if (key === 'e' || key === 'E') {
              if (!this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen && !this.state.isShopOpen) {
                  this.interact();
              }
          }

          // Skip Wave (L)
          if (key === 'l' || key === 'L') {
               if (!this.state.isPaused && this.state.appMode === AppMode.GAMEPLAY && !this.state.isGameOver && !this.state.missionComplete) {
                   this.skipWave();
               }
          }
          
          // Toggle Pause (Stats Terminal)
          if (key === 'p' || key === 'P') {
              if (!this.state.isTacticalMenuOpen && !this.state.isInventoryOpen && this.state.activeTurretId === undefined) {
                  this.togglePause();
              }
          }

          if (key === 'Escape') {
              this.state.isShopOpen = false;
              if (this.state.isTacticalMenuOpen) this.toggleTacticalMenu();
              if (this.state.isInventoryOpen) this.toggleInventory();
              if (this.state.activeTurretId !== undefined) this.closeTurretUpgrade(); 
              if (this.state.isPaused && this.state.activeTurretId === undefined) this.togglePause();
          }

          // Grenade
          if ((key === 'g' || key === 'G') && !this.state.isPaused && !this.state.isTacticalMenuOpen && !this.state.isInventoryOpen) this.throwGrenade();
          
          // Reload
          if ((key === 'r' || key === 'R') && !this.state.isPaused) this.reloadWeapon(Date.now());
      }
  }

  public switchWeapon(index: number) {
      if (index >= 0 && index < 4) {
          this.state.player.currentWeaponIndex = index;
          // Cancel reload if switching
          const p = this.state.player;
          Object.values(p.weapons).forEach(w => w.reloading = false);
      }
  }

  public reset(fullReset: boolean = false) {
    const basePos = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 100 };
    
    // Preserve persistent data across resets if not a full reset
    const existingPlanets = !fullReset && this.state?.planets ? this.state.planets : generatePlanets();
    const existingSaveSlots = !fullReset && this.state?.saveSlots ? this.state.saveSlots : [];
    const existingSpaceship = !fullReset && this.state?.spaceship ? this.state.spaceship : { installedModules: [] };

    // Initialize Weapons
    const initialWeapons: Record<string, WeaponState> = {};
    Object.values(WeaponType).forEach(type => {
      initialWeapons[type] = {
        type,
        ammoInMag: WEAPONS[type].magSize,
        ammoReserve: INITIAL_AMMO[type],
        lastFireTime: 0,
        reloading: false,
        reloadStartTime: 0,
        modules: [],
        consecutiveShots: 0
      };
    });

    const initialTurretSpots = TURRET_POSITIONS.map((pos, idx) => ({
      id: idx,
      x: basePos.x + pos.x,
      y: basePos.y + pos.y,
    }));

    // Start with Barren terrain, deployToPlanet will overwrite if needed
    const terrain = generateTerrain(PlanetVisualType.BARREN, 'BARREN' as any);

    this.state = {
      appMode: AppMode.GAMEPLAY,
      gameMode: GameMode.SURVIVAL,
      
      planets: existingPlanets,
      currentPlanet: null,
      selectedPlanetId: null,
      savedPlayerState: null,
      spaceship: existingSpaceship,
      saveSlots: existingSaveSlots,

      camera: { x: 0, y: 0 },
      player: {
        id: 'player',
        x: basePos.x,
        y: basePos.y - 150,
        radius: 15,
        angle: -Math.PI / 2,
        color: '#3B82F6',
        hp: PLAYER_STATS.maxHp,
        maxHp: PLAYER_STATS.maxHp,
        armor: PLAYER_STATS.maxArmor,
        maxArmor: PLAYER_STATS.maxArmor,
        speed: PLAYER_STATS.speed,
        lastHitTime: 0,
        weapons: initialWeapons as Record<WeaponType, WeaponState>,
        loadout: [WeaponType.AR, WeaponType.SG, WeaponType.SR, WeaponType.PISTOL],
        inventory: new Array(INVENTORY_SIZE).fill(null),
        upgrades: [],
        freeModules: [],
        grenadeModules: [],
        currentWeaponIndex: 0,
        grenades: PLAYER_STATS.maxGrenades,
        score: PLAYER_STATS.initialScore,
        isAiming: false
      },
      base: {
        x: basePos.x,
        y: basePos.y,
        width: BASE_STATS.width,
        height: BASE_STATS.height,
        hp: BASE_STATS.maxHp,
        maxHp: BASE_STATS.maxHp,
      },
      terrain,
      bloodStains: [],
      enemies: [],
      allies: [],
      projectiles: [],
      particles: [],
      turretSpots: initialTurretSpots,
      toxicZones: [],
      activeSpecialEvent: SpecialEventType.NONE,

      wave: 1,
      waveTimeRemaining: 30000, // Wave 1 is 30s
      waveDuration: 30000, 
      spawnTimer: 0,
      enemiesPendingSpawn: 17, // Wave 1: 12 + 5*1 = 17
      enemiesSpawnedInWave: 0,
      totalEnemiesInWave: 99999, // Unused with new queue logic
      lastAllySpawnTime: 0,

      isGameOver: false,
      missionComplete: false,
      isPaused: false,
      isTacticalMenuOpen: false,
      isInventoryOpen: false,
      isShopOpen: false,
      messages: [],
      
      settings: {
        showHUD: true,
        showBlood: true,
        showDamageNumbers: true,
        language: 'EN'
      },
      stats: {
        shotsFired: 0,
        shotsHit: 0,
        damageDealt: 0,
        killsByType: {
            [EnemyType.GRUNT]: 0,
            [EnemyType.RUSHER]: 0,
            [EnemyType.TANK]: 0,
            [EnemyType.KAMIKAZE]: 0,
            [EnemyType.VIPER]: 0,
            'BOSS': 0
        },
        encounteredEnemies: []
      }
    };
  }

  public deployToPlanet(id: string) {
      // Capture the target planet from the existing state BEFORE reset
      const targetPlanet = this.state.planets.find(p => p.id === id);
      
      if (!targetPlanet) {
          console.error("Planet not found for deployment:", id);
          return;
      }

      // Calculate Drop Cost
      const currentScraps = this.state.player.score;
      const dropCost = Math.floor(currentScraps * (targetPlanet.landingDifficulty / 100));

      this.reset(false); // Do not wipe planets
      
      // Apply Cost
      this.state.player.score -= dropCost;
      this.state.player.score = Math.max(0, this.state.player.score);

      this.state.gameMode = GameMode.EXPLORATION;
      this.state.selectedPlanetId = id;
      this.state.currentPlanet = targetPlanet;
      this.state.appMode = AppMode.GAMEPLAY;
      
      // Recalculate pending spawn for wave 1 based on queue logic
      this.state.enemiesPendingSpawn = 12 + 5 * 1; 

      // Add a message about the drop cost
      setTimeout(() => {
        this.addMessage(`ORBITAL DROP COST: -${dropCost} SCRAPS`, this.state.player.x, this.state.player.y - 100, '#F87171');
      }, 1000);
      
      // Generate Terrain
      this.state.terrain = generateTerrain(targetPlanet.visualType, targetPlanet.biome);
  }
  
  public update(time: number) {
    if (this.lastTime === 0) {
      this.lastTime = time;
      return;
    }
    const dt = time - this.lastTime;
    this.lastTime = time;

    if (this.state.isPaused || this.state.isGameOver || this.state.appMode !== AppMode.GAMEPLAY) return;

    // --- Wave Management ---
    if (!this.state.missionComplete) {
        this.state.waveTimeRemaining -= dt;
        
        // Spawn Logic (Fixed Queue)
        this.state.spawnTimer += dt;
        const SPAWN_INTERVAL = 500; // Fixed 0.5s spawn rate for items in queue

        if (this.state.spawnTimer > SPAWN_INTERVAL) {
            if (this.state.enemiesPendingSpawn > 0) {
                this.spawnEnemy();
                this.state.enemiesPendingSpawn--;
            }
            this.state.spawnTimer = 0;
        }

        // Timer ended -> Next Wave
        if (this.state.waveTimeRemaining <= 0) {
            this.nextWave();
        }
    }

    // --- Player Logic ---
    this.updatePlayer(dt, time);

    // --- Entity Updates ---
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateAllies(dt, time);
    this.updateTurrets(time);
    this.updateParticles(dt);
    this.updateToxicZones(dt);

    // --- Camera ---
    const targetCamX = this.state.player.x - CANVAS_WIDTH / 2;
    const targetCamY = this.state.player.y - CANVAS_HEIGHT / 2;
    this.state.camera.x = Math.max(0, Math.min(targetCamX, WORLD_WIDTH - CANVAS_WIDTH));
    this.state.camera.y = Math.max(0, Math.min(targetCamY, WORLD_HEIGHT - CANVAS_HEIGHT));
  }

  // ... (rest of methods - nextWave, updatePlayer, etc. remain unchanged)
  public nextWave() {
      // Exploration Mode Victory Check
      if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet) {
          if (this.state.wave >= this.state.currentPlanet.totalWaves) {
              this.completeMission();
              return;
          }
      }

      this.state.wave++;
      this.state.activeSpecialEvent = SpecialEventType.NONE; // Reset event

      // Time Calculation
      let duration = 30;
      if (this.state.wave <= 10) {
          duration = 30 + (this.state.wave - 1) * 2;
      } else {
          duration = 30 + (9 * 2) + (this.state.wave - 10) * 1;
      }
      this.state.waveDuration = duration * 1000;
      this.state.waveTimeRemaining = duration * 1000;
      this.state.spawnTimer = 0;

      // New Event Logic: Every 5 waves
      let isFrenzy = false;
      if (this.state.wave % 5 === 0) {
          const roll = Math.random();
          if (roll < 0.3) {
              // 30% Chance: Frenzy
              this.state.activeSpecialEvent = SpecialEventType.FRENZY;
              isFrenzy = true;
              this.addMessage("WARNING: FRENZY DETECTED", WORLD_WIDTH/2, WORLD_HEIGHT/2, 'red');
          } else {
              // 70% Chance: Boss Incubation
              this.state.activeSpecialEvent = SpecialEventType.BOSS;
              this.spawnBoss(); // Spawn boss alongside normal mobs
              this.addMessage("WARNING: APEX LIFEFORM", WORLD_WIDTH/2, WORLD_HEIGHT/2, 'purple');
          }
      } else {
          this.addMessage(`WAVE ${this.state.wave} STARTED`, WORLD_WIDTH/2, WORLD_HEIGHT/2, 'yellow');
      }

      // Add enemies to queue
      // Formula: 12 + 5 * Wave.
      // If Frenzy: 3x count.
      let newEnemies = 12 + 5 * this.state.wave;
      if (isFrenzy) {
          newEnemies *= 3;
      }
      
      this.state.enemiesPendingSpawn += newEnemies;
  }

  public skipWave() {
      // Logic: If at least 10 seconds have passed in current wave
      // Elapsed Time = Duration - Remaining
      const elapsed = this.state.waveDuration - this.state.waveTimeRemaining;
      
      if (elapsed >= 10000) {
          // Calculate Reward: (Remaining Seconds) * Current Wave
          const remainingSeconds = Math.max(0, Math.floor(this.state.waveTimeRemaining / 1000));
          const reward = remainingSeconds * this.state.wave;
          
          this.state.player.score += reward;
          this.addMessage(`LURE DEPLOYED: +${reward} SCRAPS`, this.state.player.x, this.state.player.y - 80, '#22d3ee');
          this.audio.playBaseDamage(); // Reuse sound or add new sound
          
          // Trigger next wave immediately
          this.nextWave();
      } else {
          // Feedback that it's too early?
          this.addMessage("LURE CHARGING...", this.state.player.x, this.state.player.y - 50, 'gray');
      }
  }

  // ... [updatePlayer and others remain the same] ...
  private updatePlayer(dt: number, time: number) {
      const p = this.state.player;
      const speed = p.speed;
      
      let dx = 0;
      let dy = 0;

      if (this.input.keys['w'] || this.input.keys['W']) dy -= 1;
      if (this.input.keys['s'] || this.input.keys['S']) dy += 1;
      if (this.input.keys['a'] || this.input.keys['A']) dx -= 1;
      if (this.input.keys['d'] || this.input.keys['D']) dx += 1;

      // Normalize
      if (dx !== 0 || dy !== 0) {
          const len = Math.sqrt(dx*dx + dy*dy);
          dx /= len;
          dy /= len;
          p.x += dx * speed;
          p.y += dy * speed;

          p.x = Math.max(p.radius, Math.min(WORLD_WIDTH - p.radius, p.x));
          p.y = Math.max(p.radius, Math.min(WORLD_HEIGHT - p.radius, p.y));
      }

      const mouseWorldX = this.input.mouse.x + this.state.camera.x;
      const mouseWorldY = this.input.mouse.y + this.state.camera.y;
      p.angle = Math.atan2(mouseWorldY - p.y, mouseWorldX - p.x);

      p.isAiming = (p.loadout[p.currentWeaponIndex] === WeaponType.SR && this.input.mouse.rightDown);

      if (this.input.mouse.down) {
          this.attemptFireWeapon(time);
      }

      const weapon = p.weapons[p.loadout[p.currentWeaponIndex]];
      if (weapon.reloading) {
          if (time - weapon.reloadStartTime >= WEAPONS[weapon.type].reloadTime) {
              weapon.reloading = false;
              const needed = WEAPONS[weapon.type].magSize - weapon.ammoInMag;
              const available = Math.min(needed, weapon.ammoReserve);
              weapon.ammoInMag += available;
              weapon.ammoReserve -= available;
              this.addMessage("RELOADED", p.x, p.y - 40, '#fff');
          }
      } else {
           if (weapon.ammoInMag <= 0 && weapon.ammoReserve > 0) {
               this.reloadWeapon(time);
           }
      }

      if (time - p.lastHitTime > PLAYER_STATS.armorRegenDelay && p.armor < p.maxArmor) {
          p.armor = Math.min(p.maxArmor, p.armor + PLAYER_STATS.armorRegenRate * dt);
      }
      if (time - p.lastHitTime > PLAYER_STATS.hpRegenDelay && p.hp < p.maxHp) {
          p.hp = Math.min(p.maxHp, p.hp + PLAYER_STATS.hpRegenRate * dt);
      }
  }

  private attemptFireWeapon(time: number) {
      const p = this.state.player;
      const weaponType = p.loadout[p.currentWeaponIndex];
      const weaponState = p.weapons[weaponType];
      const stats = WEAPONS[weaponType];

      if (weaponState.reloading) return;
      if (weaponState.ammoInMag <= 0) return;

      let fireRate = stats.fireRate;
      const boltMod = weaponState.modules.find(m => m.type === ModuleType.PRESSURIZED_BOLT);
      if (boltMod) {
          const reduction = Math.min(0.5, weaponState.consecutiveShots * 0.1); 
          fireRate = fireRate * (1 - reduction);
      }

      if (time - weaponState.lastFireTime >= fireRate) {
          weaponState.lastFireTime = time;
          weaponState.ammoInMag--;
          weaponState.consecutiveShots++;

          setTimeout(() => { 
             if (Date.now() - weaponState.lastFireTime > fireRate * 2) weaponState.consecutiveShots = 0; 
          }, fireRate * 2.1);

          this.audio.playWeaponFire(weaponType);
          this.state.stats.shotsFired++;

          const createProj = (angleOffset: number = 0) => {
              const spread = (Math.random() - 0.5) * stats.spread;
              const angle = p.angle + spread + angleOffset;
              
              let damage = stats.damage;
              weaponState.modules.forEach(m => {
                  if (m.type === ModuleType.GEL_BARREL) damage *= 1.4;
                  if (m.type === ModuleType.MICRO_RUPTURER) damage *= 1.6;
              });

              this.state.projectiles.push({
                  id: Math.random().toString(),
                  x: p.x + Math.cos(angle) * 20,
                  y: p.y + Math.sin(angle) * 20,
                  vx: Math.cos(angle) * stats.projectileSpeed,
                  vy: Math.sin(angle) * stats.projectileSpeed,
                  damage: damage,
                  rangeRemaining: stats.range,
                  maxRange: stats.range,
                  fromPlayer: true,
                  radius: 3,
                  angle: angle,
                  color: '#FEF08A',
                  weaponType: weaponType,
                  isExplosive: stats.isExplosive,
                  isPiercing: stats.isPiercing,
                  hitIds: []
              });
          };

          if (weaponType === WeaponType.SG) {
              const pellets = stats.pellets || 8;
              for(let i=0; i<pellets; i++) createProj();
          } else {
              createProj();
          }
      }
  }

  public reloadWeapon(time: number) {
      const p = this.state.player;
      const weapon = p.weapons[p.loadout[p.currentWeaponIndex]];
      if (!weapon.reloading && weapon.ammoReserve > 0 && weapon.ammoInMag < WEAPONS[weapon.type].magSize) {
          weapon.reloading = true;
          weapon.reloadStartTime = time;
      }
  }

  public throwGrenade() {
      const p = this.state.player;
      if (p.grenades > 0) {
          p.grenades--;
          const mouseWorldX = this.input.mouse.x + this.state.camera.x;
          const mouseWorldY = this.input.mouse.y + this.state.camera.y;
          const angle = Math.atan2(mouseWorldY - p.y, mouseWorldX - p.x);
          
          this.state.projectiles.push({
              id: Math.random().toString(),
              x: p.x,
              y: p.y,
              vx: Math.cos(angle) * 15,
              vy: Math.sin(angle) * 15,
              damage: PLAYER_STATS.grenadeDamage,
              rangeRemaining: 400,
              maxRange: 400,
              fromPlayer: true,
              radius: 6,
              angle: angle,
              color: '#F97316',
              isExplosive: true,
              isHoming: false 
          });
          this.audio.playGrenadeThrow();
      } else {
          this.addMessage("NO GRENADES", p.x, p.y - 50, 'red');
      }
  }

  private updateProjectiles(dt: number) {
      for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
          const p = this.state.projectiles[i];
          p.x += p.vx; p.y += p.vy;
          p.rangeRemaining -= Math.sqrt(p.vx*p.vx + p.vy*p.vy);

          if (p.isHoming && p.targetId) {
              const target = this.state.enemies.find(e => e.id === p.targetId);
              if (target) {
                  const angleToTarget = Math.atan2(target.y - p.y, target.x - p.x);
                  const turnSpeed = p.turnSpeed || 0.1;
                  let diff = angleToTarget - p.angle;
                  while (diff < -Math.PI) diff += Math.PI*2;
                  while (diff > Math.PI) diff -= Math.PI*2;
                  p.angle += Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
                  const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
                  p.vx = Math.cos(p.angle) * speed;
                  p.vy = Math.sin(p.angle) * speed;
              }
          }

          if (p.rangeRemaining <= 0 || p.x < 0 || p.x > WORLD_WIDTH || p.y < -500 || p.y > WORLD_HEIGHT) {
              if (p.isExplosive) this.explodeProjectile(p);
              else if (p.createsToxicZone) this.createToxicZone(p.x, p.y);
              this.state.projectiles.splice(i, 1);
              continue;
          }

          let hit = false;
          if (p.fromPlayer) {
              for (let j = 0; j < this.state.enemies.length; j++) {
                  const e = this.state.enemies[j];
                  if (p.hitIds?.includes(e.id)) continue; 

                  const dist = Math.sqrt((p.x - e.x)**2 + (p.y - e.y)**2);
                  if (dist < e.radius + p.radius) {
                      this.damageEnemy(e, p.damage);
                      hit = true;
                      this.spawnParticle(p.x, p.y, e.color, 2, 0.5); 
                      if (p.isExplosive) {
                          this.explodeProjectile(p);
                          this.state.projectiles.splice(i, 1);
                      } else if (p.isPiercing) {
                          if (!p.hitIds) p.hitIds = [];
                          p.hitIds.push(e.id);
                          hit = false; 
                      } else {
                          this.state.projectiles.splice(i, 1);
                      }
                      this.state.stats.shotsHit++;
                      break; 
                  }
              }
          } else {
              const targets: Entity[] = [this.state.player, ...this.state.allies];
              if (p.x > this.state.base.x - this.state.base.width/2 && p.x < this.state.base.x + this.state.base.width/2 &&
                  p.y > this.state.base.y - this.state.base.height/2 && p.y < this.state.base.y + this.state.base.height/2) {
                      this.damageBase(p.damage);
                      this.state.projectiles.splice(i, 1);
                      continue;
              }
              for (const t of targets) {
                  const dist = Math.sqrt((p.x - t.x)**2 + (p.y - t.y)**2);
                  if (dist < t.radius + p.radius) {
                      this.damageEntity(t, p.damage);
                      if (p.createsToxicZone) this.createToxicZone(p.x, p.y);
                      this.state.projectiles.splice(i, 1);
                      hit = true;
                      break;
                  }
              }
          }
      }
  }

  private explodeProjectile(p: Projectile) {
      const radius = 100; 
      this.audio.playExplosion();
      for(let i=0; i<10; i++) this.spawnParticle(p.x, p.y, '#F59E0B', 4, 1);

      if (p.fromPlayer) {
          this.state.enemies.forEach(e => {
              const dist = Math.sqrt((p.x - e.x)**2 + (p.y - e.y)**2);
              if (dist < radius) {
                  const falloff = 1 - (dist / radius);
                  this.damageEnemy(e, p.damage * falloff);
              }
          });
      }
  }

  private createToxicZone(x: number, y: number) {
      this.state.toxicZones.push({
          id: Math.random().toString(),
          x, y,
          radius: TOXIC_ZONE_STATS.radius,
          life: TOXIC_ZONE_STATS.duration,
          damagePerSecond: TOXIC_ZONE_STATS.dps,
          createdAt: Date.now()
      });
  }

  private updateToxicZones(dt: number) {
      for(let i = this.state.toxicZones.length - 1; i >= 0; i--) {
          const zone = this.state.toxicZones[i];
          zone.life -= dt;
          if (zone.life <= 0) {
              this.state.toxicZones.splice(i, 1);
              continue;
          }
          const p = this.state.player;
          const dist = Math.sqrt((zone.x - p.x)**2 + (zone.y - p.y)**2);
          if (dist < zone.radius) {
              this.damageEntity(p, zone.damagePerSecond * (dt/1000));
          }
      }
  }

  private damageEnemy(e: Enemy, amount: number) {
      e.hp -= amount;
      this.state.stats.damageDealt += amount;
      if (this.state.settings.showDamageNumbers) {
          this.addMessage(Math.floor(amount).toString(), e.x, e.y - 20, '#FFF');
      }
      if (e.hp <= 0) {
          this.killEnemy(e);
      }
  }

  private killEnemy(e: Enemy) {
      this.audio.playEnemyDeath(e.type === EnemyType.TANK || !!e.isBoss);
      this.state.player.score += e.scoreReward;
      this.state.stats.killsByType[e.isBoss ? 'BOSS' : e.type]++;
      
      if (e.isBoss && e.bossType && !this.state.stats.encounteredEnemies.includes(e.bossType)) {
          this.state.stats.encounteredEnemies.push(e.bossType);
      } else if (!e.isBoss && !this.state.stats.encounteredEnemies.includes(e.type)) {
          this.state.stats.encounteredEnemies.push(e.type);
      }

      if (this.state.settings.showBlood) {
          const blotches = [];
          for(let i=0; i<3 + Math.random()*3; i++) {
              blotches.push({
                  x: (Math.random()-0.5) * 20,
                  y: (Math.random()-0.5) * 20,
                  r: 5 + Math.random() * 10
              })
          }
          this.state.bloodStains.push({
              id: Math.random().toString(),
              x: e.x,
              y: e.y,
              color: e.color === '#A855F7' ? '#7E22CE' : '#7F1D1D',
              life: 30000,
              maxLife: 30000,
              blotches
          });
      }
      this.state.enemies = this.state.enemies.filter(en => en.id !== e.id);
  }

  private damageEntity(e: Entity, amount: number) {
      if ('hp' in e) {
          const entity = e as any;
          if (entity.id === 'player') {
             const p = entity as typeof this.state.player;
             let effectiveDmg = amount;
             if (p.armor > 0) {
                 const mitigation = p.upgrades.includes(DefenseUpgradeType.INFECTION_DISPOSAL) ? 0.9 : 0.7;
                 const absorbed = amount * mitigation;
                 p.armor -= absorbed;
                 effectiveDmg = amount - absorbed;
                 if (p.armor < 0) {
                     effectiveDmg += Math.abs(p.armor);
                     p.armor = 0;
                 }
             }
             p.hp -= effectiveDmg;
             p.lastHitTime = this.lastTime;
             if (p.hp <= 0) this.gameOver();
          } else {
             entity.hp -= amount;
             if (entity.hp <= 0) {
                 if (this.state.allies.includes(entity)) {
                     this.state.allies = this.state.allies.filter(a => a.id !== entity.id);
                 } else {
                     const spot = this.state.turretSpots.find(s => s.builtTurret === entity);
                     if (spot) spot.builtTurret = undefined;
                 }
             }
          }
      }
  }

  private damageBase(amount: number) {
      this.state.base.hp -= amount;
      this.audio.playBaseDamage();
      if (this.state.base.hp <= 0) this.gameOver();
  }

  private spawnEnemy() {
      // Use helper to determine type based on game rules
      const type = selectEnemyType(
          this.state.wave, 
          this.state.gameMode, 
          this.state.currentPlanet, 
          this.state.activeSpecialEvent
      );

      const baseStats = ENEMY_STATS[type];
      
      // Calculate Environmental/Planetary Modifiers (HP/Dmg scaling)
      const { maxHp, damage } = calculateEnemyStats(type, baseStats, this.state.currentPlanet, this.state.gameMode);

      // Spawn Logic: Always from TOP line (y ~= -50), X is random
      // Base is at y ~= 3100.
      const spawnX = Math.random() * WORLD_WIDTH;
      const spawnY = -50; // Just off-screen top

      // Apply Wave Difficulty scaling on top of planetary base stats
      const finalHp = maxHp * (1 + this.state.wave * 0.1);

      this.state.enemies.push({
          id: Math.random().toString(),
          type,
          x: spawnX,
          y: spawnY,
          ...baseStats,
          damage: damage, // Applied modifier
          maxHp: finalHp,
          hp: finalHp,
          angle: Math.PI / 2, // Facing Down
          lastAttackTime: 0
      });
      this.state.enemiesSpawnedInWave++;
  }

  private spawnBoss() {
      const bossTypes = [BossType.RED_SUMMONER, BossType.BLUE_BURST, BossType.PURPLE_ACID];
      const type = bossTypes[Math.floor(Math.random() * bossTypes.length)];
      const stats = BOSS_STATS[type];
      
      // Calculate Scaling
      let finalHp = stats.hp;
      if (this.state.gameMode === GameMode.EXPLORATION && this.state.currentPlanet) {
          finalHp *= this.state.currentPlanet.geneStrength;
      }
      
      // Wave Scaling
      finalHp = finalHp * (1 + this.state.wave * 0.25);

      // Boss spawns top center
      this.state.enemies.push({
          id: `boss-${Date.now()}`,
          type: EnemyType.TANK, 
          bossType: type,
          isBoss: true,
          x: WORLD_WIDTH / 2,
          y: -100, 
          ...stats,
          maxHp: finalHp,
          hp: finalHp,
          angle: Math.PI / 2,
          lastAttackTime: 0
      });
  }

  // ... [Rest of update methods remain same] ...

  private updateEnemies(dt: number) {
      const p = this.state.player;
      const b = this.state.base;
      const tNow = this.lastTime;

      this.state.enemies.forEach(e => {
          // Identify Closest Target (Base, Player, Ally, or Turret)
          
          // 1. Base Distance (AABB)
          const bDx = Math.max(Math.abs(e.x - b.x) - b.width / 2, 0);
          const bDy = Math.max(Math.abs(e.y - b.y) - b.height / 2, 0);
          const distBase = Math.sqrt(bDx*bDx + bDy*bDy);
          
          let closestTarget: { type: 'BASE' | 'PLAYER' | 'ALLY' | 'TURRET', entity: any, dist: number, x: number, y: number } = 
              { type: 'BASE', entity: b, dist: distBase, x: b.x, y: b.y };

          // 2. Player Distance
          const distPlayer = Math.sqrt((e.x - p.x)**2 + (e.y - p.y)**2) - p.radius;
          if (distPlayer < closestTarget.dist) {
              closestTarget = { type: 'PLAYER', entity: p, dist: distPlayer, x: p.x, y: p.y };
          }

          // 3. Allies
          this.state.allies.forEach(a => {
               const dist = Math.sqrt((e.x - a.x)**2 + (e.y - a.y)**2) - a.radius;
               if (dist < closestTarget.dist) {
                   closestTarget = { type: 'ALLY', entity: a, dist: dist, x: a.x, y: a.y };
               }
          });

          // 4. Turrets
          this.state.turretSpots.forEach(s => {
              if (s.builtTurret) {
                  const t = s.builtTurret;
                  const dist = Math.sqrt((e.x - t.x)**2 + (e.y - t.y)**2) - 20; // Approx Turret Radius
                  if (dist < closestTarget.dist) {
                       closestTarget = { type: 'TURRET', entity: t, dist: dist, x: t.x, y: t.y };
                  }
              }
          });

          if (closestTarget) {
              // Move towards closest target center
              const angle = Math.atan2(closestTarget.y - e.y, closestTarget.x - e.x);
              e.angle = angle;
              e.x += Math.cos(angle) * e.speed;
              e.y += Math.sin(angle) * e.speed;

              // Melee Attack Logic (Distance <= 5 means overlapping or touching)
              if (closestTarget.dist <= 5) {
                  if (tNow - e.lastAttackTime > 1000) {
                       let damage = e.damage;

                       if (closestTarget.type === 'BASE') {
                           this.damageBase(damage);
                       } else if (closestTarget.type === 'PLAYER') {
                           if (p.upgrades.includes(DefenseUpgradeType.IMPACT_PLATE)) damage *= 0.8;
                           this.damageEntity(p, damage);
                           this.audio.playMeleeHit();
                       } else {
                           this.damageEntity(closestTarget.entity, damage);
                           this.audio.playMeleeHit();
                       }

                       e.lastAttackTime = tNow;
                  }

                  // Kamikaze Special Behavior
                  if (e.type === EnemyType.KAMIKAZE) {
                      if (closestTarget.type === 'BASE') {
                          this.damageBase(e.damage * 2); 
                      } 
                      this.createToxicZone(e.x, e.y);
                      this.killEnemy(e);
                  }
              }
          }

          // Ranged Logic (Viper / Bosses)
          if (e.type === EnemyType.VIPER || !!e.isBoss) {
             const cooldown = !!e.isBoss ? 1500 : 2000;
             if (tNow - e.lastAttackTime > cooldown) {
                 this.state.projectiles.push({
                     id: Math.random().toString(),
                     x: e.x, y: e.y,
                     vx: Math.cos(e.angle) * 8, // Shoots towards closest target
                     vy: Math.sin(e.angle) * 8,
                     damage: e.damage,
                     rangeRemaining: 600,
                     fromPlayer: false,
                     radius: 5,
                     angle: e.angle,
                     color: e.color,
                     createsToxicZone: e.bossType === BossType.PURPLE_ACID
                 });
                 e.lastAttackTime = tNow;
                 this.audio.playViperShoot();
             }
          }
      });
  }

  private updateAllies(dt: number, time: number) {
      // 1. Auto-Spawn Check (Every 60s)
      if (time - this.state.lastAllySpawnTime > 60000) {
          if (this.state.allies.length < ALLY_STATS.maxCount) {
              this.state.allies.push({
                  id: Math.random().toString(),
                  x: this.state.base.x - 120, // Spawn left clone vat
                  y: this.state.base.y,
                  ...ALLY_STATS,
                  maxHp: ALLY_STATS.hp,
                  angle: -Math.PI/2,
                  color: '#60A5FA',
                  currentOrder: 'PATROL',
                  state: 'PATROL',
                  lastFireTime: 0,
                  radius: 12,
                  patrolPoint: { x: this.state.base.x, y: this.state.base.y - 150 } // Patrol front of base
              });
              this.addMessage("CLONE DEPLOYED", this.state.base.x, this.state.base.y - 60, '#60A5FA');
          }
          this.state.lastAllySpawnTime = time;
      }

      // 2. AI Behavior
      this.state.allies.forEach(ally => {
          let targetX = ally.patrolPoint.x;
          let targetY = ally.patrolPoint.y;

          // Find Target Enemy
          const nearestEnemy = this.state.enemies.reduce((nearest, current) => {
              const dist = Math.sqrt((current.x - ally.x)**2 + (current.y - ally.y)**2);
              if (!nearest || dist < nearest.dist) {
                  return { enemy: current, dist };
              }
              return nearest;
          }, null as { enemy: Enemy, dist: number } | null);

          // State Machine Overrides
          if (ally.currentOrder === 'FOLLOW') {
              targetX = this.state.player.x + Math.cos(time * 0.001 + parseInt(ally.id)*2) * 80;
              targetY = this.state.player.y + Math.sin(time * 0.001 + parseInt(ally.id)*2) * 80;
          } else if (ally.currentOrder === 'ATTACK' && nearestEnemy) {
              targetX = nearestEnemy.enemy.x;
              targetY = nearestEnemy.enemy.y;
          }

          // Combat Logic (Kiting)
          let moveSpeed = ally.speed;
          
          if (nearestEnemy && nearestEnemy.dist < 600) {
              ally.state = 'COMBAT';
              // Look at enemy
              ally.angle = Math.atan2(nearestEnemy.enemy.y - ally.y, nearestEnemy.enemy.x - ally.x);
              
              if (ally.currentOrder !== 'FOLLOW') {
                // Kiting Logic: Ideal distance 150 - 300
                if (nearestEnemy.dist < 150) {
                    // Too close! Retreat!
                    const retreatAngle = ally.angle + Math.PI;
                    targetX = ally.x + Math.cos(retreatAngle) * 100;
                    targetY = ally.y + Math.sin(retreatAngle) * 100;
                } else if (nearestEnemy.dist > 300) {
                    // Too far, advance
                    targetX = nearestEnemy.enemy.x;
                    targetY = nearestEnemy.enemy.y;
                } else {
                    // Sweet spot, maybe strafe slightly or stand ground
                    targetX = ally.x; 
                    targetY = ally.y;
                }
              }

              // Fire Weapon
              if (time - ally.lastFireTime > 500) { // Increased fire rate to 500ms
                   this.state.projectiles.push({
                       id: Math.random().toString(),
                       x: ally.x, y: ally.y,
                       vx: Math.cos(ally.angle) * 15,
                       vy: Math.sin(ally.angle) * 15,
                       damage: ally.damage,
                       rangeRemaining: 400,
                       fromPlayer: true, 
                       radius: 3,
                       angle: ally.angle,
                       color: '#60A5FA'
                   });
                   this.audio.playAllyFire();
                   ally.lastFireTime = time;
              }

          } else {
              ally.state = ally.currentOrder === 'FOLLOW' ? 'FOLLOW' : 'PATROL';
          }

          // Movement Physics
          const dx = targetX - ally.x;
          const dy = targetY - ally.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 5) {
              ally.x += (dx/dist) * moveSpeed;
              ally.y += (dy/dist) * moveSpeed;
              if (ally.state !== 'COMBAT') {
                  ally.angle = Math.atan2(dy, dx);
              }
          }
      });
  }

  private updateTurrets(time: number) {
      this.state.turretSpots.forEach(spot => {
          const t = spot.builtTurret;
          if (t && time - t.lastFireTime > t.fireRate) {
              let target: Enemy | undefined;
              if (t.type === TurretType.MISSILE) {
                  target = this.state.enemies[Math.floor(Math.random() * this.state.enemies.length)];
              } else {
                  let minDist = t.range;
                  this.state.enemies.forEach(e => {
                      const dist = Math.sqrt((e.x - t.x)**2 + (e.y - t.y)**2);
                      if (dist < minDist) {
                          minDist = dist;
                          target = e;
                      }
                  });
              }

              if (target) {
                  const angle = Math.atan2(target.y - t.y, target.x - t.x);
                  t.angle = angle;
                  t.lastFireTime = time;
                  this.audio.playTurretFire(t.level);

                  this.state.projectiles.push({
                       id: Math.random().toString(),
                       x: t.x + Math.cos(angle)*20, 
                       y: t.y + Math.sin(angle)*20,
                       vx: Math.cos(angle) * (t.type === TurretType.SNIPER ? 40 : 20),
                       vy: Math.sin(angle) * (t.type === TurretType.SNIPER ? 40 : 20),
                       damage: t.damage,
                       rangeRemaining: t.range,
                       fromPlayer: true,
                       radius: t.type === TurretType.MISSILE ? 6 : 4,
                       angle: angle,
                       color: t.type === TurretType.GAUSS ? '#10B981' : '#FCD34D',
                       isHoming: t.type === TurretType.MISSILE,
                       targetId: t.type === TurretType.MISSILE ? target.id : undefined,
                       turnSpeed: 0.15,
                       isExplosive: t.type === TurretType.MISSILE
                  });
              }
          }
      });
  }

  public spawnParticle(x: number, y: number, color: string, speed: number, life: number) {
      const angle = Math.random() * Math.PI * 2;
      this.state.particles.push({
          id: Math.random().toString(),
          x, y,
          vx: Math.cos(angle) * speed * Math.random(),
          vy: Math.sin(angle) * speed * Math.random(),
          color,
          life,
          maxLife: life,
          radius: Math.random() * 2 + 1,
          angle: 0
      });
  }

  private updateParticles(dt: number) {
      for(let i=this.state.particles.length-1; i>=0; i--) {
          const p = this.state.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= dt / 1000;
          if (p.life <= 0) this.state.particles.splice(i, 1);
      }
  }

  public completeMission() {
      this.state.missionComplete = true;
      if (this.state.currentPlanet) {
          const idx = this.state.planets.findIndex(p => p.id === this.state.currentPlanet?.id);
          if (idx !== -1) this.state.planets[idx].completed = true;
      }
      this.state.isPaused = true;
  }

  public gameOver() {
      this.state.isGameOver = true;
      this.state.isPaused = true;
  }

  public interact() {
      const p = this.state.player;
      let closestSpot: any = null;
      let minDist = 60;
      this.state.turretSpots.forEach(s => {
          const dist = Math.sqrt((s.x - p.x)**2 + (s.y - p.y)**2);
          if (dist < minDist) {
              closestSpot = s;
              minDist = dist;
          }
      });

      if (closestSpot) {
          if (closestSpot.builtTurret) {
              this.state.activeTurretId = closestSpot.id;
          } else {
              const cost = TURRET_COSTS.baseCost + (this.state.turretSpots.filter(s => s.builtTurret).length * TURRET_COSTS.costIncrement);
              if (p.score >= cost) {
                  p.score -= cost;
                  closestSpot.builtTurret = {
                      ...TURRET_STATS[TurretType.STANDARD],
                      id: Math.random().toString(),
                      x: closestSpot.x,
                      y: closestSpot.y,
                      radius: 20,
                      angle: 0,
                      color: '#059669',
                      level: 1,
                      type: TurretType.STANDARD,
                      lastFireTime: 0,
                      maxHp: TURRET_STATS[TurretType.STANDARD].hp
                  };
                  this.addMessage("TURRET BUILT", closestSpot.x, closestSpot.y, '#10B981');
              } else {
                  this.addMessage("INSUFFICIENT FUNDS", p.x, p.y - 50, 'red');
              }
          }
      }
  }

  public purchaseItem(itemKey: string) {
      const p = this.state.player;
      if (itemKey.includes('AMMO') || itemKey === 'GRENADE') {
          const cost = SHOP_PRICES[itemKey as keyof typeof SHOP_PRICES] || 99999;
          if (p.score >= cost) {
              p.score -= cost;
              if (itemKey === 'AR_AMMO') p.weapons[WeaponType.AR].ammoReserve += 60;
              if (itemKey === 'SG_AMMO') p.weapons[WeaponType.SG].ammoReserve += 16;
              if (itemKey === 'SR_AMMO') p.weapons[WeaponType.SR].ammoReserve += 10;
              if (itemKey === 'PULSE_AMMO') p.weapons[WeaponType.PULSE_RIFLE].ammoReserve += 90;
              if (itemKey === 'FLAME_AMMO') p.weapons[WeaponType.FLAMETHROWER].ammoReserve += 200;
              if (itemKey === 'GL_AMMO') p.weapons[WeaponType.GRENADE_LAUNCHER].ammoReserve += 12;
              if (itemKey === 'GRENADE') p.grenades++;
          }
      }
      else if (itemKey.includes('WEAPON_')) {
          const cost = SHOP_PRICES[itemKey as keyof typeof SHOP_PRICES] || 99999;
          if (p.score >= cost) {
              p.score -= cost;
              let type = WeaponType.AR;
              if (itemKey === 'WEAPON_PULSE') type = WeaponType.PULSE_RIFLE;
              if (itemKey === 'WEAPON_FLAME') type = WeaponType.FLAMETHROWER;
              if (itemKey === 'WEAPON_GL') type = WeaponType.GRENADE_LAUNCHER;
              const emptyIdx = p.inventory.findIndex(i => i === null);
              if (emptyIdx !== -1) {
                  p.inventory[emptyIdx] = { id: Math.random().toString(), type };
              } else {
                  this.addMessage("INVENTORY FULL", p.x, p.y, 'red');
                  p.score += cost; 
              }
          }
      }
      else if (itemKey in DEFENSE_UPGRADE_INFO) {
          const type = itemKey as DefenseUpgradeType;
          const info = DEFENSE_UPGRADE_INFO[type];
          if (p.score >= info.cost && !p.upgrades.includes(type)) {
               p.score -= info.cost;
               p.upgrades.push(type);
               if (type === DefenseUpgradeType.SPORE_BARRIER) {
                   p.maxArmor += 100;
                   p.armor += 100;
               }
          }
      }
      else if (itemKey in MODULE_STATS) {
           const type = itemKey as ModuleType;
           const stats = MODULE_STATS[type];
           if (p.score >= stats.cost) {
               p.score -= stats.cost;
               p.freeModules.push({ id: Math.random().toString(), type });
           }
      }
      else if (itemKey in SPACESHIP_MODULES) {
           const type = itemKey as SpaceshipModuleType;
           const stats = SPACESHIP_MODULES[type];
           if (p.score >= stats.cost) {
               p.score -= stats.cost;
               this.state.spaceship.installedModules.push(type);
               if (type === SpaceshipModuleType.BASE_REINFORCEMENT) {
                   this.state.base.maxHp += 3000;
                   this.state.base.hp += 3000;
               }
           }
      }
  }

  public equipModule(target: string, modId: string) {
      const p = this.state.player;
      const modIdx = p.freeModules.findIndex(m => m.id === modId);
      if (modIdx === -1) return;
      const mod = p.freeModules[modIdx];
      if (target === 'GRENADE') {
          if (p.grenadeModules.length < 2) {
              p.grenadeModules.push(mod);
              p.freeModules.splice(modIdx, 1);
          }
      } else {
          const w = p.weapons[target as WeaponType];
          const max = target === WeaponType.PISTOL ? 2 : 3;
          if (w.modules.length < max) {
              w.modules.push(mod);
              p.freeModules.splice(modIdx, 1);
          }
      }
  }

  public unequipModule(target: string, modId: string) {
      const p = this.state.player;
      if (target === 'GRENADE') {
          const idx = p.grenadeModules.findIndex(m => m.id === modId);
          if (idx !== -1) {
              p.freeModules.push(p.grenadeModules[idx]);
              p.grenadeModules.splice(idx, 1);
          }
      } else {
          const w = p.weapons[target as WeaponType];
          const idx = w.modules.findIndex(m => m.id === modId);
           if (idx !== -1) {
              p.freeModules.push(w.modules[idx]);
              w.modules.splice(idx, 1);
          }
      }
  }

  public addMessage(text: string, x: number, y: number, color: string) {
      this.state.messages.push({ text, x, y, color, time: 2000 });
      setTimeout(() => {
          this.state.messages = this.state.messages.filter(m => m.text !== text);
      }, 2000);
  }

  public confirmTurretUpgrade(type: TurretType) {
      const id = this.state.activeTurretId;
      if (id === undefined) return;
      const spot = this.state.turretSpots[id];
      const p = this.state.player;
      let cost = 0;
      if (type === TurretType.GAUSS) cost = TURRET_COSTS.upgrade_gauss;
      if (type === TurretType.SNIPER) cost = TURRET_COSTS.upgrade_sniper;
      if (type === TurretType.MISSILE) cost = TURRET_COSTS.upgrade_missile;
      if (p.score >= cost) {
          p.score -= cost;
          if (spot.builtTurret) {
              spot.builtTurret = {
                  ...spot.builtTurret,
                  ...TURRET_STATS[type],
                  type: type,
                  level: 2,
                  maxHp: TURRET_STATS[type].hp,
                  hp: TURRET_STATS[type].hp,
              }
          }
          this.state.activeTurretId = undefined; 
      }
  }

  public toggleInventory() { this.state.isInventoryOpen = !this.state.isInventoryOpen; }
  public toggleTacticalMenu() { this.state.isTacticalMenuOpen = !this.state.isTacticalMenuOpen; }
  public togglePause() { this.state.isPaused = !this.state.isPaused; }
  public closeTurretUpgrade() { this.state.activeTurretId = undefined; }

  public swapLoadoutAndInventory(loadoutIdx: number, inventoryIdx: number) {
      const p = this.state.player;
      const invItem = p.inventory[inventoryIdx];
      if (invItem) {
          const currentWeapon = p.loadout[loadoutIdx];
          p.loadout[loadoutIdx] = invItem.type;
          p.inventory[inventoryIdx] = { id: Math.random().toString(), type: currentWeapon };
      }
  }

  public issueOrder(order: AllyOrder) {
      this.state.allies.forEach(a => a.currentOrder = order);
      this.addMessage(`SQUAD ORDER: ${order}`, this.state.player.x, this.state.player.y - 60, '#06B6D4');
      if (this.state.allies.length < 5 && order === 'FOLLOW' && this.state.player.score > 500) {
           this.state.player.score -= 500;
           this.state.allies.push({
               id: Math.random().toString(),
               x: this.state.base.x,
               y: this.state.base.y,
               ...ALLY_STATS,
               maxHp: ALLY_STATS.hp,
               angle: 0,
               color: '#60A5FA',
               currentOrder: 'FOLLOW',
               state: 'FOLLOW',
               lastFireTime: 0,
               radius: 12,
               patrolPoint: { x: this.state.base.x + (Math.random()-0.5)*200, y: this.state.base.y - 100 }
           });
           this.addMessage("UNIT DEPLOYED", this.state.base.x, this.state.base.y - 40, '#60A5FA');
      }
  }

  public toggleSetting(key: keyof typeof this.state.settings) {
      const val = this.state.settings[key];
      if (typeof val === 'boolean') {
          (this.state.settings as any)[key] = !val;
      } else {
          this.state.settings.language = this.state.settings.language === 'EN' ? 'CN' : 'EN';
      }
  }

  public enterSurvivalMode() {
      this.reset();
      this.state.gameMode = GameMode.SURVIVAL;
      this.state.appMode = AppMode.GAMEPLAY;
  }
  public enterExplorationMode() {
      this.state.appMode = AppMode.EXPLORATION_MAP;
      this.state.gameMode = GameMode.EXPLORATION;
  }
  public selectPlanet(id: string | null) {
      this.state.selectedPlanetId = id;
  }
  public enterSpaceshipView() {
      this.state.appMode = AppMode.SPACESHIP_VIEW;
  }
  public exitSpaceshipView() {
      this.state.appMode = AppMode.EXPLORATION_MAP;
  }

  private loadSavesFromStorage(): SaveFile[] {
      try {
          const raw = localStorage.getItem(this.storageKey);
          if (raw) return JSON.parse(raw);
      } catch (e) { console.error(e); }
      return [];
  }

  public saveGame() {
      const { saveSlots, ...stateToSave } = this.state;
      const snapshot = JSON.stringify(stateToSave);
      let label = this.state.gameMode === GameMode.SURVIVAL ? `SURVIVAL - WAVE ${this.state.wave}` : `EXP - ${this.state.currentPlanet?.name || 'SPACE'} - W${this.state.wave}`;
      
      const newSave: SaveFile = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          label,
          isPinned: false,
          data: snapshot,
          mode: this.state.gameMode
      };
      
      const saves = [...this.state.saveSlots];
      if (saves.length >= MAX_SAVE_SLOTS) {
          saves.sort((a, b) => a.timestamp - b.timestamp);
          const unpinned = saves.findIndex(s => !s.isPinned);
          if (unpinned !== -1) saves.splice(unpinned, 1);
          else saves.shift();
      }
      saves.push(newSave);
      saves.sort((a, b) => b.timestamp - a.timestamp);
      this.state.saveSlots = saves;
      localStorage.setItem(this.storageKey, JSON.stringify(saves));
      this.addMessage("STATE ARCHIVED", this.state.player.x, this.state.player.y - 50, 'cyan');
  }

  public loadGame(id: string) {
      const save = this.state.saveSlots.find(s => s.id === id);
      if (!save) return;
      try {
          const loaded: GameState = JSON.parse(save.data);
          const currentSaves = this.state.saveSlots;
          const currentSettings = this.state.settings;

          this.state = {
              ...loaded,
              saveSlots: currentSaves,
              settings: { ...loaded.settings, language: currentSettings.language }
          };

          const p = this.state.player;
          Object.values(p.weapons).forEach(w => {
              w.lastFireTime = 0; w.reloadStartTime = 0; w.reloading = false;
              if (w.type === WeaponType.PISTOL && !w.ammoReserve) w.ammoReserve = Infinity;
          });
          this.state.allies.forEach(a => a.lastFireTime = 0);
          this.state.turretSpots.forEach(s => { if(s.builtTurret) s.builtTurret.lastFireTime = 0; });
          
          this.lastTime = 0;
          this.state.isPaused = false;
          this.state.appMode = AppMode.GAMEPLAY;
          this.audio.resume();
          this.addMessage("MEMORY EXTRACTED", p.x, p.y - 50, 'cyan');
      } catch (e) { console.error(e); }
  }

  public deleteSave(id: string) {
      const idx = this.state.saveSlots.findIndex(s => s.id === id);
      if (idx !== -1) {
          this.state.saveSlots.splice(idx, 1);
          localStorage.setItem(this.storageKey, JSON.stringify(this.state.saveSlots));
      }
  }

  public togglePin(id: string) {
      const save = this.state.saveSlots.find(s => s.id === id);
      if (save) {
          if (!save.isPinned && this.state.saveSlots.filter(s => s.isPinned).length >= MAX_PINNED_SLOTS) return;
          save.isPinned = !save.isPinned;
          localStorage.setItem(this.storageKey, JSON.stringify(this.state.saveSlots));
      }
  }
}
