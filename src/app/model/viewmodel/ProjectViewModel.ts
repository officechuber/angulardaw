import {TrackViewModel} from "./TrackViewModel";
import {PatternViewModel} from "./PatternViewModel";
import {GridViewModel} from "./GridViewModel";
import {NoteLength} from "../mip/NoteLength";


export class ProjectViewModel {
  id: any;
  name: string="default";
  bpm: number=120;
  quantization: number=NoteLength.Quarter;
  signature: string="4,4";
  patterns: Array<PatternViewModel>=[];
  tracks: Array<TrackViewModel>=[];
  grid: GridViewModel=new GridViewModel();
}