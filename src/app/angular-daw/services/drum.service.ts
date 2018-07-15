import {Injectable} from "@angular/core";
import {SimpleDrum} from "../model/drums/SimpleDrum";
import {System} from "../../system/System";
import {AppConfiguration} from "../../app.configuration";
import {SamplesV2Service} from "./samplesV2.service";
import {Sample} from "../model/Sample";
import {ADSREnvelope} from "../model/mip/ADSREnvelope";
import {Instrument} from "../model/Instrument";
import {DrumKitSpec} from "../model/mip/drums/specs/DrumKitSpec";
import {FileService} from "./file.service";
import {Drumkit} from "../model/mip/drums/classes/Drumkit";
import {TriggerContext} from "../model/triggers/TriggerContext";
import {Trigger} from "../model/triggers/Trigger";
import {DrumSample} from "../model/mip/drums/classes/DrumSample";
import {DrumMapping} from "../model/mip/drums/specs/DrumMapping";

@Injectable()
export class DrumService {
  drums: SimpleDrum;
  private reverb: Sample;

  constructor(
    private samplesV2Service: SamplesV2Service,
    private system: System,
    private fileService: FileService,
    private config: AppConfiguration) {

  }

  load(): void {
    let samples = [
      this.config.getAssetsUrl("sounds/drums/drumkit1/kick1.wav"),
      this.config.getAssetsUrl("sounds/drums/drumkit1/snare1.wav"),
      this.config.getAssetsUrl("sounds/drums/drumkit1/hihat.wav")
    ]

    this.samplesV2Service.getSamples(samples).then(result => {
      let drum = this.drums = new SimpleDrum();
      drum.kick = result[0];
      drum.snare = result[1];
      drum.hihat = result[2];

    }, error => this.system.error(error));

    this.samplesV2Service.getSamples([this.config.getAssetsUrl("sounds/impulses/PlateMedium.wav")]).then(result => {
      this.reverb = result[0];

    }, error => this.system.error(error));

  }

  getMapping(id:string):Promise<DrumMapping>{
    return new Promise((resolve, reject) => {
      this.fileService.getFile(this.config.getAssetsUrl("config/drums/" + id + ".json"))
        .then((config: DrumMapping) => {
          resolve(config);
        })
        .catch(error => reject(error));
    })
  }

  getDrumKit(id: string): Promise<Drumkit> {
    return new Promise((resolve, reject) => {
      let drumKit = new Drumkit(this.system);
      this.fileService.getFile(this.config.getAssetsUrl("config/drums/" + id + ".json"))
        .then((config: DrumKitSpec) => {
          let promises = [];
          let urls = config.samples.map(sample => this.config.getAssetsUrl("sounds/drums/"+id+"/"+sample.url));
          let promise = this.samplesV2Service.getSamples(urls);
          promises.push(promise);
          promise.then((samples: Array<Sample>) => {
            samples.forEach((sample, i) => {
              let spec = config.samples[i];
              drumKit.samples.push(new DrumSample(spec.piece, spec.articulation, sample));
            })

          }).catch(error => reject(error));
          Promise.all(promises).then(() => resolve(drumKit)).catch(error => reject(error));
        })
        .catch(error => reject(error));
    })


  }

  playKick(): void {
    this.drums.kick.triggerWith(ADSREnvelope.default(), this.reverb);
  }

  playSnare(): void {
    this.drums.snare.triggerWith(ADSREnvelope.default(), this.reverb);
  }

  playHihat(): void {
    this.drums.hihat.triggerWith(ADSREnvelope.default(), this.reverb);
  }
}
