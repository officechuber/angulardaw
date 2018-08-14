import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {System} from "../system/System";
import {PatternViewModel} from "../model/viewmodel/PatternViewModel";
import {ProjectViewModel} from "../model/viewmodel/ProjectViewModel";
import {ApiEndpoint} from "../shared/api/ApiEndpoint";
import {GridCellViewModel} from "../model/viewmodel/GridCellViewModel";
import {TrackViewModel} from "../model/viewmodel/TrackViewModel";
import {ProjectsService} from "../shared/services/projects.service";
import {Project} from "../model/daw/Project";

@Component({
  selector: 'main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {
  projectViewModel: ProjectViewModel;
  focusedPattern: PatternViewModel;
  project: Project;
  gridCellDimensionIndex: number = 0;
  gridCellDimensions = [
    {width: 100, height: 50},
    {width: 200, height: 100}
  ];
  sequencerCellDimensionIndex: number = 0;
  sequencerGridCellDimensions = [
    {width: 100, height: 50},
    {width: 200, height: 100}
  ];


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    @Inject("ProjectsApi") private projectsApi: ApiEndpoint<ProjectViewModel>,
    private system: System) {

  }

  close(): void {
    this.router.navigate(['/']);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.projectsApi.get(params.projectId).subscribe(project => {
        this.projectViewModel = project;
        this.projectsService.loadProject(project).then(project => this.project = project);
      }, error => this.system.error(error));
    });
  }

  onTrackAdded(trackViewModel: TrackViewModel): void {
    this.projectsService.addTrack(this.project,trackViewModel);
  }

  onTrackRemoved(trackViewModel: TrackViewModel): void {

  }

  onPluginChanged(trackViewModel: TrackViewModel): void {
    this.projectsService.setPlugin(this.project.tracks.find(t=>t.id===trackViewModel.id),trackViewModel.pluginId);
  }


  save(): void {
    this.projectsApi.put(this.projectViewModel)
      .subscribe(() => {

        console.log("projectViewModel saved")
      }, error => {
        this.system.error(error)
      });
  }

  focusedPatternChanged(pattern: PatternViewModel): void {
    this.focusedPattern = pattern;
  }
}



