import {Observable} from "rxjs/internal/Observable";
import {EventEmitter} from "@angular/core";

export interface TransportEvents {
  tickTock: Observable<number>;
  beat: Observable<number>;
  time: Observable<number>;
  transportEnd: EventEmitter<void>;
  beforeStart: EventEmitter<void>;
  transportStart: EventEmitter<void>;
  timeReset: EventEmitter<number>;
}
