
import { BiomeType, GameEventType, PlaySoundEvent, AppMode } from "../types";
import { AudioContextModule } from "./audio/AudioContextModule";
import { SynthesizerModule } from "./audio/SynthesizerModule";
import { MusicModule } from "./audio/MusicModule";
import { AmbienceModule } from "./audio/AmbienceModule";
import { EventBus } from "./EventBus";
import { EVENT_TO_SOUND_MAP } from "../data/config/audio";

export class AudioService {
  private core: AudioContextModule;
  private synthesizer: SynthesizerModule;
  private music: MusicModule;
  private ambience: AmbienceModule;
  private events: EventBus;

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

      // 3. Mode Switching
      this.events.on(GameEventType.UI_UPDATE, (e: any) => {
          if (['MODE_SWITCH', 'RETURN_MAIN_MENU', 'RESET', 'RETURN_MAP', 'DEPLOY', 'ASCEND', 'EVAC'].includes(e.reason)) {
              if (e.reason === 'RETURN_MAIN_MENU') {
                  this.stopAmbience();
                  this.music.start();
              } else if (e.reason === 'DEPLOY' || e.reason === 'RESET') {
                  this.stopAmbience(); 
                  this.music.start();
              } else if (e.reason === 'RETURN_MAP' || e.reason === 'ASCEND' || e.reason === 'EVAC') {
                  this.stopAmbience();
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

      // 1. Resolve Variant Suffix
      const key = e.variant ? `${e.type}_${e.variant}` : e.type;

      // 2. Lookup in Data Map
      if (EVENT_TO_SOUND_MAP[key]) {
          profileId = EVENT_TO_SOUND_MAP[key];
      } 
      // 3. Fallback for Special Cases (Dynamic Variants)
      else if (e.type === 'TURRET' && (e.variant === 1 || e.variant === 2)) {
          // Legacy generic turret variants (UI generic sounds)
          profileId = 'TURRET_2'; 
      }
      else if (e.type === 'ENEMY_DEATH' && e.variant === true) {
          // e.variant is boolean for isBoss
          profileId = 'BOSS_DEATH';
      }
      else if (EVENT_TO_SOUND_MAP[e.type]) {
          // Direct fallback to base type if variant not found
          profileId = EVENT_TO_SOUND_MAP[e.type];
      }

      // 4. Play
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
