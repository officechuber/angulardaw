import {Track} from './Track';
import {WstPlugin} from "./WstPlugin";
import {NoteLength} from "../mip/NoteLength";
import {MatrixCell} from "./MatrixCell";


export class Project {
  id: any;
  name: string="default";
  bpm: number=120;
  quantization: number=NoteLength.Quarter;
  beatUnit:number=4;
  barUnit:number=4;
  focusedPattern:string;
  metronomeEnabled:boolean=true;
  metronome:WstPlugin;
  matrix:Array<Array<MatrixCell> >=[];
  readonly tracks: Array<Track> = [];

  constructor() {

  }

  destroy(): void {
    this.tracks.forEach(track => track.destroy());
  }


}

