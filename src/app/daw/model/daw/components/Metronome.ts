import {Sample} from "../Sample";
import {FilesApi} from "../../../shared/api/files.api";
import {SamplesApi} from "../../../shared/api/samples.api";
import {TransportService} from "../../../shared/services/transport.service";
import {Subscription} from "rxjs/internal/Subscription";
import {Track} from "../Track";
import {MusicMath} from "../../utils/MusicMath";
import {WstPlugin} from "../WstPlugin";
import {PluginId} from "../plugins/PluginId";
import {Project} from "../Project";
import {AppConfiguration} from "../../../../app.configuration";
import {NoteTrigger} from "../NoteTrigger";


export class Metronome implements WstPlugin{

  private lastBeat: number = -1;
  private accentSample: Sample;
  private otherSample: Sample;
  private transportSubscription: Subscription;

  checked:boolean=true;

  constructor(
    private audioContext: AudioContext,
    private fileService: FilesApi,
              private project:Project,
              private config: AppConfiguration,
              private transportService: TransportService,
              private samplesV2Service: SamplesApi) {

    let track = new Track("_metronome",this.audioContext, this.transportService.getEvents(), this.transportService.getInfo());
    let tickTime =
      MusicMath.getTickTime(this.transportService.params.bpm.getValue(),
        this.transportService.params.quantization.getValue());
    let beatTicks = MusicMath.getBeatTicks(this.transportService.params.quantization.getValue());
    let beatTime = tickTime * beatTicks;

    for (let i = 0; i < 100; i++) {
      track.events.push(new NoteTrigger(null, "",i*beatTime));
    }

    track.plugin=this;

 /*   this.streamer = new PerformanceStreamer([], this.transportService.getEvents(), this.transportService.getInfo());
    this.subscriptions.push(this.streamer.trigger.subscribe(event => this.onNextEvent(event.offset, event.event)));

    this.transportSubscription = transportService.tickTock.subscribe(tick => {
      // this.feed(this.transportService.getPositionInfo())
    });*/
  }


  destroy(): void {
    this.transportSubscription.unsubscribe();
  }

 /* feed(position: TransportPosition): void {
    /!*if (position.beat !== this.lastBeat) {
      if (position.beat === 0) this.accentSample.trigger(0);
      else this.otherSample.trigger(0);
    }*!/

  }*/

 isChecked():boolean{
   return this.project.metronomeEnabled;
 }
  load(): Promise<WstPlugin> {
    return new Promise((resolve, reject) => {
      this.samplesV2Service.getClickSamples().then(result => {
        this.accentSample = result.accentSample;
        this.otherSample = result.defaultSample;
        resolve(this);
      })
        .catch(error => reject(error));
    })
  }

  feed(event: NoteTrigger, offset: number): any {
    if (this.project.metronomeEnabled){
      let tick = MusicMath.getTickForTime(event.time,this.transportService.params.bpm.getValue(),this.transportService.params.quantization.getValue());
      let beat = MusicMath.getBeatNumber(tick,this.transportService.params.quantization.getValue(),this.transportService.params.signature.getValue());
      if (beat===0) this.accentSample.trigger(offset);
      else this.otherSample.trigger(offset);
    }

  }

  getId(): PluginId {
    return undefined;
  }

  getNotes(): Array<string> {
    return [];
  }

}