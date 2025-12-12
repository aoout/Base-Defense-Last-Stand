
import { BiomeType } from "../types";
import { AudioContextModule } from "./audio/AudioContextModule";
import { SynthesizerModule } from "./audio/SynthesizerModule";
import { MusicModule } from "./audio/MusicModule";
import { AmbienceModule } from "./audio/AmbienceModule";

export class AudioService {
  private core: AudioContextModule;
  private synthesizer: SynthesizerModule;
  private music: MusicModule;
  private ambience: AmbienceModule;

  constructor() {
    this.core = new AudioContextModule();
    this.synthesizer = new SynthesizerModule(this.core);
    this.music = new MusicModule(this.core);
    this.ambience = new AmbienceModule(this.core);
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

  public play(profileId: string, x?: number, y?: number) {
      this.synthesizer.play(profileId, x, y);
  }

  public startAmbience(biome: BiomeType) {
      this.ambience.start(biome);
  }

  public stopAmbience() {
      this.ambience.stop();
  }
}
