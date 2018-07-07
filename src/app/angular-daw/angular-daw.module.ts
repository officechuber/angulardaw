import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {BeatviewerComponent} from "./plugins/beatviewer/beatviewer.component";
import {MetronomeComponent} from "./plugins/metronome/metronome.component";
import {SysinfoComponent} from "./plugins/sysinfo/sysinfo.component";
import {SequencerComponent} from "./plugins/sequencer/sequencer.component";
import {BpmCircleComponent} from "./d3/bpm-circle/bpm-circle.component";
import {ClockComponent} from "./d3/clock/clock.component";
import {SliderComponent} from "./d3/slider/slider.component";
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule} from "@angular/forms";
import {HttpClientModule} from "@angular/common/http";
import { AngularDawComponent } from './angular-daw/angular-daw.component';
import {AngularDesktopModule} from "../angular-desktop/angular-desktop.module";
import {AngularDawService} from "./services/angular-daw.service";
import {FileService} from "./services/file.service";
import {SystemMonitorService} from "./services/system-monitor.service";
import {MidiWriterService} from "./services/midi-writer.service";
import {MetronomeService} from "./services/metronome.service";
import {TransportService} from "./services/transport.service";
import {AudioContextService} from "./services/audiocontext.service";
import {MidiReaderService} from "./services/midi-reader.service";
import {MidiStreamService} from "./services/midi-stream.service";
import {MidiPlayerService} from "./services/midi-player.service";
import {ProjectService} from "./services/project.service";
import {SamplesService} from "./services/samples.service";
import {AngularDawApi} from "./angular-daw.api";
import {LoggingService} from "./services/logging.service";
import {NotificationService} from "./services/notification.service";
import { DevelopmentComponent } from './plugins/development/development.component';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AngularDesktopModule
  ],
  declarations: [
    BeatviewerComponent,
    MetronomeComponent,
    SequencerComponent,
    SysinfoComponent,
    BpmCircleComponent,
    ClockComponent,
    SliderComponent,
    AngularDawComponent,
    DevelopmentComponent
  ],
  exports:[
    AngularDawComponent
  ],
  providers:[
    AngularDawService,
    AudioContextService,
    FileService,
    SystemMonitorService,
    MidiWriterService,
    MetronomeService,
    TransportService,
    MidiReaderService,
    MidiStreamService,
    MidiPlayerService,
    ProjectService,
    SamplesService,
    AngularDawApi,
    LoggingService,
    NotificationService
  ]
})
export class AngularDAWModule { }
