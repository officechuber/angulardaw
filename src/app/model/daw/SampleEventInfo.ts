import {Lang} from "../utils/Lang";

export class SampleEventInfo{
  constructor() {

    this.id=Lang.guid();
  }


  id:string;
  note:string;
  time:number;
  offset:number;
  duration:number;
  loopLength:number;
  loopsDone:number=0;
  getOffset:()=>number;
  detune:number=0;



}
