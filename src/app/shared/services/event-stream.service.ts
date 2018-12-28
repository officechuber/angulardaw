import {Inject, Injectable} from '@angular/core';
import {DawInfo} from "../../model/DawInfo";
import {Subscription} from "rxjs";
import {Thread} from "../../model/daw/Thread";
import {Pattern} from "../../model/daw/Pattern";
import {SampleEventInfo} from "../../model/daw/SampleEventInfo";
import {MusicMath} from "../../model/utils/MusicMath";
import {AudioContextService} from "./audiocontext.service";
import {Sample} from "../../model/daw/Sample";
import {Notes} from "../../model/mip/Notes";
import {NoteEvent} from "../../model/mip/NoteEvent";
import {NoteInfo} from "../../model/utils/NoteInfo";

@Injectable({
  providedIn: 'root'
})
export class EventStreamService {

  private ticker: Thread;
  private subscriptions: Array<Subscription> = [];
  private isRunning: boolean = false;
  private loop: boolean = false;
  private audioContext: AudioContext;
  patterns: Array<Pattern>;
  private samples: Array<{ value: Sample, pattern: Pattern }> = [];

  constructor(
    @Inject("daw") private daw: DawInfo,
    @Inject("Notes") private notes: Notes,
    private audioContextService: AudioContextService) {
    this.audioContext = audioContextService.getAudioContext();
  }


  start(): void {
    if (this.isRunning) {
      this.stop();
    } else {
      this.isRunning = true;
      this.loop = true;
      this.debug("start");
      let project = this.daw.project.getValue();
      this.ticker = project.threads.find(t => t.id === "ticker");
      this.ticker.post(
        {
          command: "set-interval"
          , params: MusicMath.getTickTime(project.transport.settings.global.bpm, project.settings.quantizationBase)
        });
      this.subscriptions.push(this.ticker.error.subscribe(error => console.error(error)));


      let loopBars = 0;


      let patterns: Array<Pattern> = this.patterns = [];
      this.debug("channels: " + project.transport.channels);
      project.transport.channels.forEach(channel => {
        let pattern = project.patterns.find(pattern => pattern.id === channel);
        if (pattern) {
          patterns.push(pattern);
          /*this.subscriptions.push(this.ticker.message
            .pipe(filter(event =>  {

            }))
            .subscribe(event => ));*/
        }
      });
      patterns.push(project.metronomePattern);

      patterns.forEach(pattern => {
        if (pattern.getLengthInBars() > loopBars) loopBars = pattern.getLengthInBars();
      });

      let loopLength = MusicMath.getLength(
        loopBars,
        project.transport.settings.global.bpm,
        project.transport.settings.global.beatUnit);

      this.debug("loop length " + loopLength);

      let startTime: number;

      this.subscriptions.push(Sample.onEnd.subscribe((event: { relatedEvent: SampleEventInfo, sample: Sample }) => {

        if (this.loop) {
          let pattern = this.samples.find(_sample => _sample.value.id === event.sample.id).pattern;
          event.relatedEvent.loopsDone = pattern.loopsPlayed;
          event.sample.trigger(event.relatedEvent);
        }
      }));


      let start = false;
      let startPromise = new Promise<void>((resolve) => {
        setInterval(() => {
          if (start) resolve();

        })
      });

      patterns.forEach(pattern => {
        this.subscriptions.push(pattern.noteInserted.subscribe((event) => {

          let sample = event.sample = pattern.plugin.getSample(event.note);
          if (sample) {

            let sampleEvent = this.createSampleEventFromNoteEvent(event, pattern, startTime, sample.baseNote);
            sampleEvent.getOffset = () => startTime + sampleEvent.loopLength * pattern.loopsPlayed;

            let subscription = pattern.tick.subscribe((tick) => {
              if (tick === 0) {
                subscription.unsubscribe();
                sample.trigger(sampleEvent, startPromise);
                let existingSample = this.samples.find(s => s.value.id === sample.id);
                if (!existingSample) this.samples.push({value: sample, pattern: pattern});
              }
            });

            this.subscriptions.push(subscription);
          }


        }));
        this.subscriptions.push(pattern.noteRemoved.subscribe((event) => {
          console.log("note noteRemoved");
        }));
        this.subscriptions.push(pattern.noteUpdated.subscribe((event) => {
          console.log("note noteUpdated");
        }));


        pattern.events.forEach(event => {
          /* if (event.sample) {
             event.sample.stop();
             event.sample.destroy();
           }*/

          let sample = event.sample = pattern.plugin.getSample(event.note);
          let sampleEvent = this.createSampleEventFromNoteEvent(event, pattern, startTime, sample.baseNote);
          sampleEvent.getOffset = () => startTime + sampleEvent.loopLength * pattern.loopsPlayed;

          sample.trigger(sampleEvent, startPromise);
          this.samples.push({value: sample, pattern: pattern});
        });
      });

      startTime = this.audioContext.currentTime;
      start = true;
      this.ticker.post({command: "start"});
    }

  }


  private createSampleEventFromNoteEvent(event: NoteEvent, pattern: Pattern, startTime: number, baseNote: NoteInfo): SampleEventInfo {
    let sampleEvent = new SampleEventInfo();
    sampleEvent.note = event.note;
    sampleEvent.time = event.time / 1000;
    sampleEvent.loopLength = pattern.getLength() / 1000;
    //sampleEvent.getOffset = () => startTime + sampleEvent.loopLength * sampleEvent.loopsPlayed;
    sampleEvent.duration = event.length ? event.length / 1000 : MusicMath.getBeatTime(pattern.transportContext.settings.global.bpm);

    if (baseNote) sampleEvent.detune = this.notes.getInterval(baseNote, this.notes.getNote(event.note)) * 100;

    return sampleEvent;
  }

  stop(): void {
    this.isRunning = false;
    this.loop = false;
    this.debug("stop");
    this.ticker.post({command: "stop"});
    this.daw.project.getValue().transport.channels.length = 0;
    this.subscriptions.forEach(sub => {
      if (!sub.closed) sub.unsubscribe();
    });
    this.samples.forEach(sample => sample.value.stop());

    this.samples.length=0;


  }

  private debug(msg): void {
    console.debug(msg);
  }

}


