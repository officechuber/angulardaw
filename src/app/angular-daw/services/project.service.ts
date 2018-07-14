import {Injectable} from "@angular/core";
import {MidiFile} from "../model/midi/midifilespec/MidiFile";
import {Project} from "../model/project/Project";
import {MidiTrack} from "../model/project/MidiTrack";
import {InstrumentsEnum} from "../model/InstrumentsEnum";
import {Instrument} from "../model/Instrument";
import {NoteInfo} from "../model/utils/NoteInfo";

@Injectable()
export class ProjectService {

  constructor() {

  }

  createProjectFromMidiFile(midi: MidiFile): Promise<Project> {
    throw "not implemented";
   /* let project = new Project();
    project.bpm=midi.header.bpm;
    return new Promise((resolve, reject) => {
      let promises = [];
      midi.tracks.forEach(fileTrack => {
        if (fileTrack.notes && fileTrack.notes.length >0) {
          let track = new MidiTrack();
          track.notes = fileTrack.notes.map(note=>NoteInfo.fromMidiNote(note));
          project.tracks.push(track);
          let promise = this.samplesService.getSamplesForInstrument(InstrumentsEnum.PIANO).then(results => {
            let instrument = new Instrument();
            instrument.id = InstrumentsEnum.PIANO;
            instrument.samples = results;
            track.instrument = instrument;

          })
          promises.push(promise);
        }
      });

      Promise.all(promises).then(() => resolve(project)).catch(error=>console.log(error))
    })*/
  }
}
