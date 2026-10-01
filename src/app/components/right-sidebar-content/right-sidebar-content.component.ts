import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Time, Timespan } from '@helgoland/core';
import { DatasetStyle, SeriesGraphDataset } from '@helgoland/d3';
import { TranslateModule } from '@ngx-translate/core';

import { AppRouterService } from '../../services/app-router.service';
import {
  AppConfig,
  ConfigurationService,
} from '../../services/configuration.service';
import {
  DatasetsService,
  LoadingDataset,
} from '../../services/graph-datasets.service';
import { DiagramViewInitStateService } from '../../views/diagram-view/diagram-view-permalink.service';
import { AuthenticationComponent } from '../authentication/authentication.component';
import { DatasetLegendEntryComponent } from '../dataset-legend-entry/dataset-legend-entry.component';
import { DownloadDataComponent } from '../download-data/download-data.component';
import { ModalFavoriteListButtonComponent } from '../favorites/modal-favorite-list-button/modal-favorite-list-button.component';
import { ModalMainConfigButtonComponent } from '../main-config/modal-main-config-button/modal-main-config-button.component';
import { ShareButtonComponent } from '../share-button/share-button.component';
import { UsernameComponent } from '../username/username.component';

@Component({
  selector: 'app-right-sidebar-content',
  templateUrl: './right-sidebar-content.component.html',
  styleUrls: ['./right-sidebar-content.component.scss'],
  standalone: true,
  imports: [
    AuthenticationComponent,
    DatasetLegendEntryComponent,
    DownloadDataComponent,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    MatToolbarModule,
    MatTooltipModule,
    ModalFavoriteListButtonComponent,
    ModalMainConfigButtonComponent,
    ShareButtonComponent,
    TranslateModule,
    UsernameComponent,
  ],
})
export class RightSidebarContentComponent {
  protected graphDatasetsSrvc = inject(DatasetsService);
  protected initStateService = inject(DiagramViewInitStateService);
  protected appRouter = inject(AppRouterService);
  private time = inject(Time);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private injector = inject(Injector);
  private configSrvc = inject(
    ConfigurationService<AppConfig>,
  ) as ConfigurationService<AppConfig>;

  dataTableVisible = this.configSrvc.getSettings().dataTableVisible || false;

  isLoading(
    dataset: SeriesGraphDataset<DatasetStyle> | LoadingDataset,
  ): dataset is LoadingDataset {
    return dataset instanceof LoadingDataset;
  }

  deleteDataset(id: string, index: number) {
    this.graphDatasetsSrvc.deleteDataset(id, true);
    this.focusAfterDelete(index);
  }

  deleteAllDatasets() {
    this.graphDatasetsSrvc.deleteAllDatasets();
    this.focusAfterDelete(0);
  }

  /**
   * The remove button goes with its entry, and the browser drops the focus on
   * the document. Move it to the next entry's header instead, or the previous
   * one after the last entry, or to the settings button - always there - once
   * the legend is empty (WCAG 2.4.3).
   */
  private focusAfterDelete(index: number) {
    afterNextRender(
      () => {
        const headers = this.host.nativeElement.querySelectorAll<HTMLElement>(
          'helgoland-dataset-legend-entry mat-expansion-panel-header',
        );
        const target =
          headers[Math.min(index, headers.length - 1)] ??
          this.host.nativeElement.querySelector<HTMLElement>(
            'helgoland-modal-main-config-button button',
          );
        target?.focus();
      },
      { injector: this.injector },
    );
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
