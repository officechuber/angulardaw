import {TransportEvents} from "./events/TransportEvents";
import {TransportInfo} from "./TransportInfo";
import {PerformanceStreamer} from "./events/PerformanceStreamer";
import {WstPlugin} from "./WstPlugin";
import {BehaviorSubject, Subject, Subscription} from "rxjs";
import {TrackControlParameters} from "./TrackControlParameters";
import {Pattern} from "./Pattern";
import {NoteTrigger} from "./NoteTrigger";

export class Track {
  id: any;
  index: number;
  name: string;
  patterns: Array<Pattern> = [];
  pluginId: string;
  ghost: boolean = false;
  events: Array<NoteTrigger> = [];
  controlParameters: TrackControlParameters = new TrackControlParameters();
  private streamer: PerformanceStreamer;
  private subscriptions: Array<Subscription> = [];
  plugin: WstPlugin;
  destinationNode: AudioNode;
  gainNode: GainNode;

  gain: BehaviorSubject<number> = new BehaviorSubject(100);

  constructor(
    id: string,
    private audioContext: AudioContext,
    protected transportEvents: TransportEvents,
    protected transportInfo: TransportInfo) {

    this.streamer = new PerformanceStreamer(this.events, transportEvents, this.transportInfo);
    this.subscriptions.push(this.streamer.trigger.subscribe(event => this.onNextEvent(event.offset, event.event)));
    this.destinationNode = this.audioContext.destination;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.destinationNode);
    this.gain.subscribe(gain => {
      if (gain) this.gainNode.gain.setValueAtTime(gain / 100, audioContext.currentTime);
    });

    this.id = id;
  }

  private onNextEvent(offset: number, event: NoteTrigger): void {
    this.plugin.feed(event, offset, this.gainNode);
  }


  resetEvents(events: Array<NoteTrigger>): void {
    this.events = events;
    this.streamer.updateEventQueue(events);
  }

  /* addEvent(event: NoteTriggerViewModel): void {
     let insertIndex = _.sortedIndexBy(this.model.events, {'time': event.time}, event => event.time);
     this.model.events.splice(insertIndex, 0, event);
   }

   removeEvent(id:string): void {
     let index = this.model.events.findIndex(ev=>ev.id===id);
     this.model.events.splice(index, 1);

   }*/

  destroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }


}