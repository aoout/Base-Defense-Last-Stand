
import { BiomeType, GameEventType, PlaySoundEvent, AppMode } from "../types";
import { AudioContextModule } from "./audio/AudioContextModule";
import { SynthesizerModule } from "./audio/SynthesizerModule";
import { MusicModule } from "./audio/MusicModule";
import { AmbienceModule } from "./audio/AmbienceModule";
import { EventBus } from "./EventBus";

export class AudioService {
  private core: AudioContextModule;
  private synthesizer: SynthesizerModule;
  private music: MusicModule;
  private ambience: AmbienceModule;
  private events: EventBus;

  // Track state to handle transitions
  private currentAppMode: AppMode | null = null;

  constructor(eventBus: EventBus) {
    this.core = new AudioContextModule();
    this.synthesizer = new SynthesizerModule(this.core);
    this.music = new MusicModule(this.core);
    this.ambience = new AmbienceModule(this.core);
    this.events = eventBus;

    this.bindEvents();
  }

  private bindEvents() {
      // 1. Core Sound FX Listener
      this.events.on<PlaySoundEvent>(GameEventType.PLAY_SOUND, (e) => this.handleSoundEvent(e));

      // 2. UI Updates (Implicit sounds)
      this.events.on(GameEventType.UI_UPDATE, (e: any) => this.handleUIEvent(e));

      // 3. Mode Switching (Music/Ambience State Machine)
      // Since UI_UPDATE often signals mode changes, we check that too, 
      // but ideally we'd have a specific MODE_SWITCH event. 
      // For now, we piggyback on UI_UPDATE if it contains mode info, or we expose a method.
      // However, GameEngine sets state.appMode directly. 
      // The cleanest way without refactoring GameEngine's state setter is to rely on 'MODE_SWITCH' reason in notifyUI.
      this.events.on(GameEventType.UI_UPDATE, (e: any) => {
          if (e.reason === 'MODE_SWITCH' || e.reason === 'RETURN_MAIN_MENU' || e.reason === 'RESET' || e.reason === 'RETURN_MAP' || e.reason === 'DEPLOY' || e.reason === 'ASCEND' || e.reason === 'EVAC') {
              // We need to poll the state from somewhere, but AudioService shouldn't hold GameState.
              // Instead, we will rely on the payload or simply infer from the 'reason' what to stop/start.
              // Actually, GameEngine calls `notifyUI` *after* changing state.
              // But we don't have access to state here.
              // So we will rely on specific calls from GameEngine via a specialized event or infer context.
              
              // Simplification: logic is handled by specific methods called by GameEngine if needed, 
              // BUT to fully decouple, we should inspect the event or just stop/start based on assumptions.
              
              if (e.reason === 'RETURN_MAIN_MENU') {
                  this.stopAmbience();
                  this.music.start();
              } else if (e.reason === 'DEPLOY' || e.reason === 'RESET') {
                  // Entering gameplay
                  this.stopAmbience(); 
                  this.music.start();
              } else if (e.reason === 'RETURN_MAP' || e.reason === 'ASCEND' || e.reason === 'EVAC') {
                  this.stopAmbience();
                  // Map ambience?
              }
          }
      });
  }

  public async resume() {
    await this.core.resume();
    if (!this.music.active) {
        this.music.start();
    }
  }

  public updateCamera(x: number, y: number, viewportWidth?: number) {
      this.synthesizer.updateCamera(x, y, viewportWidth);
  }

  public startAmbience(biome: BiomeType) {
      this.ambience.start(biome);
  }

  public stopAmbience() {
      this.ambience.stop();
  }

  // --- EVENT HANDLERS ---

  private handleSoundEvent(e: PlaySoundEvent) {
      let profileId = '';

      switch (e.type) {
          case 'WEAPON': 
              profileId = `WEAPON_${e.variant}`; 
              break;
          case 'RELOAD': 
              profileId = `RELOAD_${e.variant}`; 
              break;
          case 'TURRET': 
              // Handle variant: can be string ('BUILD') or TurretType or Number (level)
              if (e.variant === 'BUILD') profileId = 'TURRET_BUILD';
              else if (e.variant === 'UPGRADE') profileId = 'TURRET_UPGRADE';
              else if (e.variant === 2 || e.variant === 1) profileId = 'TURRET_2'; // Generic UI beep
              else profileId = `TURRET_${e.variant}`;
              break;
          case 'ENEMY_DEATH': 
              profileId = e.variant ? 'BOSS_DEATH' : 'ENEMY_DEATH'; 
              break;
          // Direct mappings
          case 'ALLY': profileId = 'ALLY_SHOOT'; break;
          case 'EXPLOSION': profileId = 'EXPLOSION'; break;
          case 'GRENADE': 
          case 'GRENADE_THROW': profileId = 'GRENADE_THROW'; break;
          case 'VIPER_SHOOT': profileId = 'VIPER_SHOOT'; break;
          case 'MELEE_HIT': profileId = 'MELEE_HIT'; break;
          case 'BASE_DAMAGE': profileId = 'BASE_DAMAGE'; break;
          case 'BULLET_HIT': profileId = 'BULLET_HIT'; break;
          case 'ORBITAL_STRIKE': profileId = 'ORBITAL_STRIKE'; break;
          case 'BOSS_DEATH': profileId = 'BOSS_DEATH'; break;
      }

      if (profileId) {
          this.synthesizer.play(profileId, e.x, e.y);
      }
  }

  private handleUIEvent(e: { reason?: string }) {
      if (e.reason === 'SHOP_OPEN' || e.reason === 'TACTICAL_TOGGLE' || e.reason === 'INVENTORY_TOGGLE') {
          this.synthesizer.play('TURRET_2'); // Reuse generic beep
      }
      if (e.reason === 'SHOP_ACTION' || e.reason === 'EQUIP') {
          this.synthesizer.play('TURRET_BUILD'); // Reuse mechanical sound
      }
  }

  // --- VOLUME CONTROL INTERFACE ---

  private setGainSafe(gainNode: GainNode, value: number) {
      const ctx = this.core.ctx;
      const now = ctx.currentTime;
      const param = gainNode.gain;
      
      param.cancelScheduledValues(now);
      try {
          param.setValueAtTime(param.value, now);
      } catch (e) {
          param.setValueAtTime(value, now); 
      }
      param.linearRampToValueAtTime(Math.max(0, Math.min(1, value)), now + 0.1);
  }

  public setMasterVolume(value: number) {
      this.setGainSafe(this.core.masterGain, value);
  }

  public setMusicVolume(value: number) {
      this.setGainSafe(this.core.musicGain, value);
  }

  public setAmbienceVolume(value: number) {
      this.setGainSafe(this.core.ambienceGain, value);
  }
}
