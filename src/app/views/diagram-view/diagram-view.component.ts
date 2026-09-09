import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  Signal,
  ViewEncapsulation,
  computed,
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
import {
  D3SeriesGraphOptions,
  HelgolandD3Module,
  HoveringStyle,
} from '@helgoland/d3';
import { TranslateModule } from '@ngx-translate/core';

import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LoadingOverlayProgressBarComponent } from '../../components/loading-overlay-progress-bar/loading-overlay-progress-bar.component';
import {
  DiagramConfig,
  ModalDiagramSettingsComponent,
} from '../../components/modal-diagram-settings/modal-diagram-settings.component';
import { GeneralTimeSelectionComponent } from '../../components/time/general-time-selection/general-time-selection.component';
import { AppRouterService } from './../../services/app-router.service';
import {
  DatasetsService,
  LIMIT_VISIBLE_DATASETS,
} from './../../services/graph-datasets.service';
@Component({
  selector: 'helgoland-diagram-view',
  templateUrl: './diagram-view.component.html',
  styleUrls: ['./diagram-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
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
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramViewComponent implements OnInit {
  private dialog = inject(MatDialog);
  protected appRouter = inject(AppRouterService);
  protected graphDatasetsSrvc = inject(DatasetsService);
  private breakpointObserver = inject(BreakpointObserver);
  private ref = inject(ChangeDetectorRef);

  private isMobile$ = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map((result) => result.matches));

  isMobile: Signal<boolean> = toSignal(this.isMobile$, { requireSync: true });

  diagramConfig: DiagramConfig = {
    overviewVisible: signal(true),
    yaxisVisible: signal(true),
    yaxisModifier: signal(true),
    hoverstyle: signal(HoveringStyle.point),
  };

  protected seriesDescription = computed(() =>
    this.graphDatasetsSrvc
      .datasets()
      .map((d) =>
        [
          d.description.phenomenonLabel,
          d.description.uom ? `(${d.description.uom})` : '',
          d.description.platformLabel,
        ]
          .filter((part) => !!part)
          .join(' '),
      )
      .join('; '),
  );

  graphOptions: Signal<D3SeriesGraphOptions> = computed<D3SeriesGraphOptions>(
    () => {
      return {
        showTimeLabel: false,
        hoverStyle: this.diagramConfig.hoverstyle(),
        togglePanZoom: true,
        yaxisModifier: this.diagramConfig.yaxisModifier(),
        yaxis: this.diagramConfig.yaxisVisible(),
      };
    },
  );

  overviewOptions: D3SeriesGraphOptions = {
    showTimeLabel: false,
    yaxis: false,
    hoverStyle: HoveringStyle.none,
    overview: true,
  };

  backgroundDataLoading: boolean = false;
  visibleDataLoading: boolean = false;
  overviewLoading: boolean = false;

  count = LIMIT_VISIBLE_DATASETS;

  ngOnInit(): void {
    this.graphDatasetsSrvc.loadingVisibleDataStatus.subscribe((ld) => {
      this.visibleDataLoading = ld;
      this.ref.markForCheck();
    });

    /*
    this.graphDatasetsSrvc.loadingBackgroundDataStatus.subscribe(
      (ld) => { 
        this.backgroundDataLoading = ld;
        this.ref.markForCheck();
      }
    );
    */

    this.graphDatasetsSrvc.loadingOverviewDataStatus.subscribe((ld) => {
      this.overviewLoading = ld;
      this.ref.markForCheck();
    });
  }

  openDiagramSettings() {
    this.dialog.open(ModalDiagramSettingsComponent, {
      data: this.diagramConfig,
    });
  }

  openMapSelection() {
    this.appRouter.toMapSelection();
  }

  openListSelection() {
    this.appRouter.toListSelection();
  }
}
