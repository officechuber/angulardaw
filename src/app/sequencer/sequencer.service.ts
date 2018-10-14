import {ElementRef, Inject, Injectable} from "@angular/core";
import {MusicMath} from "../shared/model//utils/MusicMath";
import {Loudness} from "../shared/model//mip/Loudness";

import {Pattern} from "../shared/model//daw/Pattern";
import {NoteTrigger} from "../shared/model//daw/NoteTrigger";
import {TracksService} from "../shared/services/tracks.service";
import {NoteCell} from "./model/NoteCell";
import {SequencerD3Specs} from "./model/sequencer.d3.specs";
import * as d3 from "d3";
import * as $ from "jquery";
import {TimeSignature} from "../shared/model//mip/TimeSignature";
import {Notes} from "../shared/model/daw/Notes";

@Injectable()
export class SequencerService {

  constructor( @Inject("Notes") private notes: Notes, private trackService: TracksService) {


  }

  /*createHeaderCells(transportParams: TransportParams, pattern: Pattern): Array<HeaderCell> {
    let result = [];
    let beatTicks = MusicMath.getBeatTicks(transportParams.quantization.getValue());
    let nColumns = beatTicks * pattern.length;
    for (let i = 0; i < nColumns; i++) {
      let info = new HeaderCell();
      info.beat= MusicMath.getBeatNumber(i, transportParams.quantization.getValue(), transportParams.signature.getValue());
      /!* if (i % beatTicks === 0) {
         info.position = new TransportPosition();
         info.position.beat = MusicMath.getBeatNumber(i, transportParams.quantization, transportParams.signature);
       }*!/

      result.push(info);
    }

    return result;
  }*/

  createTableCells(pattern: Pattern, specs: SequencerD3Specs): Array<NoteCell> {
    let model: Array<NoteCell> = [];
    let nColumns = MusicMath.getBeatTicks(pattern.quantization.getValue()) * pattern.length;

    specs.rows = pattern.notes.length;
    specs.columns = nColumns;
    let tickTime = MusicMath.getTickTime(pattern.transportContext.settings.global.bpm, pattern.quantization.getValue());

    // create header cells
    for (let j = 0; j < nColumns; j++) {
      let cell = new NoteCell((j+1) * specs.cellWidth, 0, specs.cellWidth, specs.cellHeight);
      cell.header = true;
      cell.beat = MusicMath.getBeatNumber(j, pattern.quantization.getValue(),
        new TimeSignature(pattern.transportContext.settings.global.beatUnit, pattern.transportContext.settings.global.barUnit));
      cell.tick = j;
      cell.row = 0;
      cell.time = tickTime * j;
      model.push(cell);
    }

    // create body cells
    for (let i = 0; i < pattern.notes.length; i++) {
      specs.rows++;
      for (let j = 0; j < nColumns; j++) {
        let cell = new NoteCell((j+1) * specs.cellWidth, (i + 1) * specs.cellHeight, specs.cellWidth, specs.cellHeight);
        cell.tick = j;
        cell.row = i+1;
        cell.column = j+1;
        cell.note = pattern.notes[i];
        cell.time = tickTime * j;
        model.push(cell);
      }
    }

    // create row header cells
    for (let i = 0; i < pattern.notes.length; i++) {
      let cell = new NoteCell(0, (i + 1) * specs.cellHeight, specs.cellWidth, specs.cellHeight);
      cell.tick = -1;
      cell.row = i;
      cell.column = 0;
      cell.note = pattern.notes[i];
      model.push(cell);
    }


    return model;

  }

  createEventCells(pattern: Pattern, specs: SequencerD3Specs): Array<NoteCell> {
    let model: Array<NoteCell> = [];
    let nColumns = MusicMath.getBeatTicks(pattern.quantization.getValue()) * pattern.length;

    //create event cells
    pattern.events.forEach(event => {
      let cell = this.createEventCell(event, pattern, specs, nColumns);
      if (cell) model.push(cell);
    });

    return model;

  }

  private createEventCell(event: NoteTrigger, pattern: Pattern, specs: SequencerD3Specs, nColumns): NoteCell {
    let eventTick = MusicMath.getTickForTime(event.time, pattern.transportContext.settings.global.bpm, pattern.quantization.getValue());
    if (eventTick < nColumns) {
      let left = this.getXPositionForTime(event.time, specs, pattern);
      let notes = pattern.notes;
      let rowIndex = notes.indexOf(event.note);
      let top = (rowIndex + 1) * specs.cellHeight;

      let width = this.getEventWidth(event.length, pattern, specs);
      let cell = new NoteCell(left, top, width, specs.cellHeight);
      this.initializeNoteCell(cell, event, pattern);

      return cell;
    }

    return null;
  }

  private initializeNoteCell(cell: NoteCell, event: NoteTrigger, pattern: Pattern): void {
    cell.tick = MusicMath.getTickForTime(event.time, pattern.transportContext.settings.global.bpm, pattern.quantization.getValue());
    let rowIndex = pattern.notes.indexOf(event.note);
    cell.row = rowIndex;
    cell.data = event;
    cell.column = cell.tick;
    cell.note = pattern.notes[rowIndex];
    cell.time = event.time;
  }


  addNote(x: number, y: number, cells: Array<NoteCell>, specs: SequencerD3Specs, pattern: Pattern): void {

    let cell = new NoteCell(x, y, specs.cellWidth, specs.cellHeight);
    let noteTime = this.getTimeForXPosition(x,specs,pattern);//fullTime * percentage;
    let rowIndex = cell.y / specs.cellHeight;
    let notes = pattern.notes;
    let note = notes[rowIndex - 1];
    let noteLength = this.getNoteLength(specs.cellWidth, pattern, specs);
    let trigger = new NoteTrigger(null, note, noteTime, noteLength, Loudness.fff, 0);
    this.initializeNoteCell(cell, trigger, pattern);
    cells.push(cell);
    pattern.insertNote(trigger);
  }


  addCellWithNote(note: NoteTrigger, cells: Array<NoteCell>, specs: SequencerD3Specs, pattern: Pattern): void {
    let nColumns = MusicMath.getBeatTicks(pattern.quantization.getValue()) * pattern.length;
    let cell = this.createEventCell(note, pattern, specs, nColumns);
    if (cell) cells.push(cell);
  }

 /* updateEvent(entry: NoteCell, specs: SequencerD3Specs, pattern: Pattern): void {
    let noteTime = this.getTimeForXPosition(entry.x,specs,pattern);
    let notes = pattern.notes;
    let rowIndex = entry.y / specs.cellHeight - 1;
    console.log("update event time is now "+noteTime);
    entry.data.note = notes[rowIndex];
    entry.data.time = noteTime;
  }*/

  removeEvent(cells: Array<NoteCell>, entry: NoteCell, pattern: Pattern): void {
    pattern.removeNote(entry.data.id);
    entry.data = null;
    let cellIndex = cells.findIndex(cell => cell.id === entry.id);
    cells.splice(cellIndex, 1);
  }

  dragStart(cell: NoteCell, container): void {
    d3.select("#sequencer-svg #" + cell.id)["moveToFront"]();
  }


  drag(cell: NoteCell, cells: Array<NoteCell>, mergeSelection): void {
    d3.select("#sequencer-svg #" + cell.id)
      .attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
    let dragOverCells = this.getDragOverCells(cells);
    if (dragOverCells.length > 0) {
      dragOverCells.forEach(cell => {
        mergeSelection.classed("drag-over", (d: NoteCell) => d.id === cell.id);
      })

      //d3.select("#sequencer-svg #" + dragOverCell.id).classed("drag-over", true)
    }
  }

  dragEnd(cell: NoteCell, cells: Array<NoteCell>, mergeSelection, pattern: Pattern, specs: SequencerD3Specs): void {
    let dragOverCell = this.getDragOverCells(cells)[0];
    if (dragOverCell) {
      mergeSelection.classed("drag-over", false);
      cell.applyAttributesFrom(dragOverCell);
      cell.data.note = cell.note;
      cell.data.time = cell.time;
    }
  }

  private getDragOverCells(cells: Array<NoteCell>): Array<NoteCell> {
    return cells.filter(cell => {
      return cell.header === false &&
        ((cell.x < d3.event.x + cell.width) && cell.x > d3.event.x) &&
        ((cell.y >= d3.event.y) && cell.y <= d3.event.y + cell.height);
    });
  }


  onDrop(event: DragEvent, cells: Array<NoteCell>): { source: NoteCell, target: NoteCell } {
    $(event.target).removeClass("drag-target");
    let data = JSON.parse(event.dataTransfer.getData("text"));
    if (data.command === "cell") {
      let sourceCell = cells.find(cell => cell.id === data.id);
      let targetCell = cells.find(cell => cell.id === $(event.target).attr("data-id"));

      return {source: sourceCell, target: targetCell};
    }
  }

  onResized(cell:NoteCell, pattern: Pattern, specs: SequencerD3Specs): void {


    let time = this.getTimeForXPosition(cell.x,specs,pattern);
    cell.data.length = this.getNoteLength(cell.width, pattern, specs);
    cell.time=time;
    cell.data.time=time;


  }

  moveCell(sourceCell: NoteCell, targetCell: NoteCell): void {
    if (targetCell && targetCell.row >= 0 && targetCell.column >= 0) {
      sourceCell.applyAttributesFrom(targetCell);
      sourceCell.data.note = sourceCell.note;
      sourceCell.data.time = sourceCell.time;
    }

  }

  private getXPositionForTime(time: number, specs: SequencerD3Specs, pattern: Pattern): number {
    let fullTime = MusicMath.getTimeAtBeat(pattern.length, 120, pattern.quantization.getValue());
    let percentage = time / fullTime;
    let fullWidth = specs.cellWidth * specs.columns;
    return fullWidth * percentage;

  }

  private getTimeForXPosition(x: number, specs: SequencerD3Specs, pattern: Pattern): number {
    let fullTime = MusicMath.getTimeAtBeat(pattern.length, pattern.transportContext.settings.global.bpm, pattern.quantization.getValue());
    let ticksPerBeat = MusicMath.getBeatTicks(pattern.quantization.getValue());
    let fullWidth = specs.cellWidth * pattern.length * ticksPerBeat;
    let percentage = x / fullWidth;

    let noteTime = fullTime * percentage;

    return noteTime;

  }

  private getEventWidth(noteLength: number, pattern: Pattern, specs: SequencerD3Specs): number {
    let fullTime = MusicMath.getTimeAtBeat(pattern.length, pattern.transportContext.settings.global.bpm, pattern.quantization.getValue());
    let fullWidth = specs.cellWidth * specs.columns;
    return fullWidth * ((noteLength * 120 / pattern.transportContext.settings.global.bpm) / fullTime);//  timePerPixel * noteLength*120/transport.getBpm();
  }

  private getNoteLength(width: number, pattern: Pattern, specs: SequencerD3Specs): number {
    let fullTime = MusicMath.getTimeAtBeat(pattern.length, 120, pattern.quantization.getValue());

    let fullWidth = specs.cellWidth * specs.columns;
    let timePerPixel = fullTime / fullWidth;

    return timePerPixel * width;
  }

  /*  onNoteCellClicked(cell: Cell, pattern: Pattern): void {
      if (cell.events.length>0) {

      }
      else {
        let trigger = new NoteTriggerDto(null, cell.note, cell.position.time, NoteLength.Quarter, Loudness.fff, 0);
        cell.events.push(trigger);
        trigger.column = cell.column;
        trigger.row = cell.row;
        this.patternsService.insertNote(pattern, trigger);
      }


    }*/
  /*



  onEventCellClicked(cell: EventCell, eventCells: Array<EventCell>, pattern: Pattern): void {
    this.patternsService.removeNote(pattern, cell.note);
    let index = _.indexOf(eventCells, cell);
    eventCells.splice(index, 1);

  }

  onEventCellPositionChanged(cell: EventCell, noteCells: Array<Array<Cell>>, pattern: Pattern, transportParams: TransportParams): void {
    cell.note.time = cell.column * MusicMath.getTickTime(transportParams.bpm, transportParams.quantization);
    cell.note.note = noteCells[cell.row][0].note;
  }*/

}