// import 'leaflet.markercluster';

import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelgolandPlatform } from '@helgoland/core';
import { LayerCreator, LayerOptions, MapCache } from '@helgoland/map';
import { TranslateModule } from '@ngx-translate/core';
import { MarkerClusterGroupOptions } from 'leaflet';

import { LayersControlComponent } from '../../components/layers-control/layers-control.component';
import { ModalDatasetByStationSelectorComponent } from '../../components/modal-dataset-by-station-selector/modal-dataset-by-station-selector.component';
import { MapConfig } from '../../components/modal-map-settings/modal-map-settings.component';
import { AppRouterService } from '../../services/app-router.service';
import {
  AppConfig,
  ConfigurationService,
} from '../../services/configuration.service';
import { DatasetsService } from '../../services/graph-datasets.service';
import { SelectedDataSourceService } from '../../services/selected-data-source.service';
import { MapSelectionStateService } from './map-selection-state.service';
import { MapSelectionViewInitStateService } from './map-selection-view-permalink.service';
import { StationMapSelectorComponent } from './station-map-selector/station-map-selector.component';

interface MapSelectionAppConfig extends AppConfig {
  mapSelectionClusterConfig: MarkerClusterGroupOptions;
}

@Component({
  selector: 'helgoland-map-selection',
  templateUrl: './map-selection.component.html',
  styleUrls: ['./map-selection.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    StationMapSelectorComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    LayersControlComponent,
  ],
})
export class MapSelectionComponent implements OnInit {
  protected appRouter = inject(AppRouterService);
  protected graphDatasetsSrvc = inject(DatasetsService);
  private configSrvc =
    inject<ConfigurationService<MapSelectionAppConfig>>(ConfigurationService);
  protected selectedDataSourceSrvc = inject(SelectedDataSourceService);
  private dialog = inject(MatDialog);
  private mapCache = inject(MapCache);
  protected state = inject(MapSelectionStateService);
  private permalink = inject(MapSelectionViewInitStateService);
  private cdr = inject(ChangeDetectorRef);

  mapId = 'timeseries';

  baseMaps: Map<string, LayerOptions> = new Map<string, LayerOptions>();

  clusterConfig: MarkerClusterGroupOptions | undefined;

  cluster = true;

  constructor() {
    // The state a freshly entered map view starts from - a share link, applied
    // right after, is allowed to override it.
    this.state.resetSelection();
    this.permalink
      .applyFromUrl()
      ?.pipe(takeUntilDestroyed())
      .subscribe((station) => this.onStationSelected(station));
  }

  ngOnInit() {
    this.clusterConfig =
      this.configSrvc.configuration.mapSelectionClusterConfig;

    this.configSrvc.configuration.baseLayers.forEach((conf) =>
      this.baseMaps.set(
        conf.label,
        new LayerCreator().createLayerOptions(conf),
      ),
    );
    this.cdr.markForCheck();
  }

  onStationSelected(station: HelgolandPlatform) {
    const service = this.selectedDataSourceSrvc.selectedService();
    if (service) {
      this.cdr.markForCheck();
      const dialogRef = this.dialog.open(
        ModalDatasetByStationSelectorComponent,
        {
          minHeight: '80vh',
          minWidth: '80vh',
        },
      );
      dialogRef.componentRef?.setInput('station', station);
      dialogRef.componentRef?.setInput('url', service.apiUrl);
      dialogRef.componentRef?.setInput(
        'phenomenonId',
        this.state.selectedPhenomenonId(),
      );
      dialogRef.componentRef?.setInput(
        'shareUrlFunction',
        this.permalink.generatePermalink,
      );

      this.state.setCurrentStationId(station.id);

      dialogRef.afterClosed().subscribe((newConf: MapConfig) => {
        this.state.setCurrentStationId(undefined);
        if (newConf) {
          this.cluster = newConf.cluster;
          this.cdr.markForCheck();
        }
      });
    }
  }
}
