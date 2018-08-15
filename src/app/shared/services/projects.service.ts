import {ProjectViewModel} from "../../model/viewmodel/ProjectViewModel";
import {GridViewModel} from "../../model/viewmodel/GridViewModel";
import {GridCellViewModel} from "../../model/viewmodel/GridCellViewModel";
import {GridColumnViewModel} from "../../model/viewmodel/GridColumnViewModel";
import {Inject, Injectable} from "@angular/core";
import {ApiEndpoint} from "../api/ApiEndpoint";
import {Observable} from "rxjs";
import {WstPlugin} from "../../model/daw/WstPlugin";
import {Track} from "../../model/daw/Track";
import {PluginId} from "../../model/daw/plugins/PluginId";
import {PluginsService} from "./plugins.service";
import {Project} from "../../model/daw/Project";
import {TrackViewModel} from "../../model/viewmodel/TrackViewModel";
import {TransportService} from "./transport.service";
import {System} from "../../system/System";
import {MusicMath} from "../../model/utils/MusicMath";
import {PatternViewModel} from "../../model/viewmodel/PatternViewModel";
import {TransportParams} from "../../model/daw/TransportParams";

@Injectable()
export class ProjectsService {

  constructor(
    @Inject("ProjectsApi") private projectsApi: ApiEndpoint<ProjectViewModel>,
    private transportService: TransportService,
    private pluginsService: PluginsService) {

  }

  createProject(name: string): ProjectViewModel {
    let project = new ProjectViewModel();
    project.id = this.guid();
    project.name = name;
    let grid = project.grid = new GridViewModel();
    grid.nColumns = 5;
    grid.nRows = 5;
    return project;
  }

  loadProject(projectViewModel: ProjectViewModel): Promise<Project> {
    return new Promise<Project>((resolve, reject) => {
      let project = new Project(projectViewModel);
      let promises = [];
      projectViewModel.tracks.forEach(track => {
        let newTrack = this.addTrack(project, track);
        if (track.pluginId) promises.push(this.setPlugin(newTrack, track.pluginId));
      });

      Promise.all(promises)
        .then(() => resolve(project))
        .catch(error => reject(error));

    })
  }

  setPlugin(track: Track, id: string): Promise<WstPlugin> {
    return new Promise<WstPlugin>((resolve, reject) => {
      try {
        if (track.plugin) track.plugin.destroy();
        track.plugin = null;
        this.pluginsService.loadPlugin(id)
          .then(plugin => {
            track.plugin = plugin;
            resolve(plugin);
          })
          .catch(error => reject(error));
      }
      catch (e) {
        reject(e);
      }

    })
  }

  removePlugin(track: Track): void {
    track.plugin.destroy();
    track.plugin = null;
  }

  addTrack<T>(project: Project, trackDto: TrackViewModel): Track {
    let track = new Track(trackDto, this.transportService.getEvents(), this.transportService.getInfo());
    track.id = trackDto.id;
    project.tracks.push(track);
    return track;
  }

  onPatternChanged(track: Track, pattern: PatternViewModel, transportParams: TransportParams): void {
    track.resetEvents(pattern.events);
    pattern.notes = track.plugin.getNotes();
    transportParams.tickEnd =
      pattern.length * MusicMath.getBeatTicks(transportParams.quantization);
  }


  guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }
}