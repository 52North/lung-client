import { MediaMatcher } from '@angular/cdk/layout';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  Signal,
  ViewEncapsulation,
  WritableSignal,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Time, Timespan } from '@helgoland/core';
import {
  D3SeriesGraphOptions,
  DatasetStyle,
  HelgolandD3Module,
  HoveringStyle,
  SeriesGraphDataset,
} from '@helgoland/d3';
import { TranslateModule } from '@ngx-translate/core';

import { AuthenticationComponent } from '../../components/authentication/authentication.component';
import { DataTableComponent } from '../../components/data-table/data-table.component';
import { DatasetLegendEntryComponent } from '../../components/dataset-legend-entry/dataset-legend-entry.component';
import { DownloadDataComponent } from '../../components/download-data/download-data.component';
import { ModalFavoriteListButtonComponent } from '../../components/favorites/modal-favorite-list-button/modal-favorite-list-button.component';
import { LoadingOverlayProgressBarComponent } from '../../components/loading-overlay-progress-bar/loading-overlay-progress-bar.component';
import {
  DiagramConfig,
  ModalDiagramSettingsComponent,
} from '../../components/modal-diagram-settings/modal-diagram-settings.component';
import { ShareButtonComponent } from '../../components/share-button/share-button.component';
import { GeneralTimeSelectionComponent } from '../../components/time/general-time-selection/general-time-selection.component';
import {
  AppConfig,
  ConfigurationService,
} from '../../services/configuration.service';
import { ModalMainConfigButtonComponent } from './../../components/main-config/modal-main-config-button/modal-main-config-button.component';
import { AppRouterService } from './../../services/app-router.service';
import {
  DatasetsService,
  LIMIT_VISIBLE_DATASETS,
  LoadingDataset,
} from './../../services/graph-datasets.service';
import { DiagramViewInitStateService } from './diagram-view-permalink.service';

type MainContentType = 'diagram' | 'table';
@Component({
  selector: 'helgoland-diagram-view',
  templateUrl: './diagram-view.component.html',
  styleUrls: ['./diagram-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    AuthenticationComponent,
    DataTableComponent,
    DatasetLegendEntryComponent,
    DownloadDataComponent,
    GeneralTimeSelectionComponent,
    HelgolandD3Module,
    LoadingOverlayProgressBarComponent,
    MatButtonModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSidenavModule,
    MatToolbarModule,
    MatTooltipModule,
    ModalFavoriteListButtonComponent,
    ModalMainConfigButtonComponent,
    ShareButtonComponent,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramViewComponent implements OnInit {
  private media = inject(MediaMatcher);
  private dialog = inject(MatDialog);
  protected appRouter = inject(AppRouterService);
  protected initStateService = inject(DiagramViewInitStateService);
  private time = inject(Time);
  protected graphDatasetsSrvc = inject(DatasetsService);
  private configSrvc = inject(
    ConfigurationService<AppConfig>,
  ) as ConfigurationService<AppConfig>;

  mobileQuery: MediaQueryList;

  diagramConfig: DiagramConfig = {
    overviewVisible: signal(true),
    yaxisVisible: signal(true),
    yaxisModifier: signal(true),
    hoverstyle: signal(HoveringStyle.point),
  };

  graphOptions: WritableSignal<D3SeriesGraphOptions> = signal({
    showTimeLabel: false,
    hoverStyle: this.diagramConfig.hoverstyle(),
    togglePanZoom: true,
    yaxisModifier: this.diagramConfig.yaxisModifier(),
  });

  overviewOptions: Signal<D3SeriesGraphOptions> = signal({
    showTimeLabel: false,
    yaxis: false,
    hoverStyle: HoveringStyle.none,
    overview: true,
  });

  mainContentType: MainContentType = 'diagram';
  dataTableVisible = this.configSrvc.getSettings().dataTableVisible || false;
  backgroundDataLoading: boolean = false;
  visibleDataLoading: boolean = false;
  overviewLoading: boolean = false;

  count = LIMIT_VISIBLE_DATASETS;

  constructor(private ref: ChangeDetectorRef) {
    this.mobileQuery = this.media.matchMedia('(max-width: 1024px)');
    // this._mobileQueryListener = () => {
    //   debugger;
    //   return this.changeDetectorRef.detectChanges();
    // };
    // this.mobileQuery.addEventListener('change', this._mobileQueryListener);
  }

  // ngOnDestroy(): void {
  //   this.mobileQuery.removeEventListener('change', this._mobileQueryListener);
  // }

  ngOnInit(): void {
    this.initStateService.preloadDatasets().subscribe((loadDs) => {
      if (!loadDs) {
        this.openMapSelection();
      }
      this.ref.markForCheck();
    });

    this.graphDatasetsSrvc.loadingVisibleDataStatus.subscribe(
      (ld) => { 
        this.visibleDataLoading = ld;
        this.ref.markForCheck();
      }
    );

    /*
    this.graphDatasetsSrvc.loadingBackgroundDataStatus.subscribe(
      (ld) => { 
        this.backgroundDataLoading = ld;
        this.ref.markForCheck();
      }
    );
    */

    this.graphDatasetsSrvc.loadingOverviewDataStatus.subscribe(
      (ld) => { 
        this.overviewLoading = ld;
        this.ref.markForCheck();
      }
    );
  }

  isLoading(
    dataset: SeriesGraphDataset<DatasetStyle> | LoadingDataset,
  ): dataset is LoadingDataset {
    return dataset instanceof LoadingDataset;
  }

  openDiagramSettings() {
    const dialogRef = this.dialog.open(ModalDiagramSettingsComponent, {
      data: this.diagramConfig,
    });

    effect(() => {
      this.graphOptions.set({
        showTimeLabel: false,
        hoverStyle: HoveringStyle[this.diagramConfig.hoverstyle()],
        yaxis: this.diagramConfig.yaxisVisible(),
        yaxisModifier: this.diagramConfig.yaxisModifier(),
      })
    })

  }

  jumpToDate(date: Date) {
    this.graphDatasetsSrvc.timespan = this.time.centerTimespan(
      this.graphDatasetsSrvc.timespan!,
      date,
    );
  }

  setTimespan(timespan: Timespan) {
    this.graphDatasetsSrvc.timespan = timespan;
  }

  openMapSelection() {
    this.appRouter.toMapSelection();
  }

  openListSelection() {
    this.appRouter.toListSelection();
  }
}
