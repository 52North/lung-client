// import 'leaflet.markercluster';

import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelgolandPlatform, HelgolandServicesConnector } from '@helgoland/core';
import { LayerCreator, LayerOptions, MapCache } from '@helgoland/map';
import { TranslateModule } from '@ngx-translate/core';
import { MarkerClusterGroupOptions } from 'leaflet';

import { LayersControlComponent } from '../../components/layers-control/layers-control.component';
import { ModalDatasetByStationSelectorComponent } from '../../components/modal-dataset-by-station-selector/modal-dataset-by-station-selector.component';
import { MapConfig, ModalMapSettingsComponent } from '../../components/modal-map-settings/modal-map-settings.component';
import { AppRouterService } from '../../services/app-router.service';
import {
  AppConfig,
  ConfigurationService,
} from '../../services/configuration.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { DatasetsService } from '../../services/graph-datasets.service';
import { MapSelectionStateService } from './map-selection-state.service';
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
  private serviceConnector = inject(HelgolandServicesConnector);
  private errorHandler = inject(ErrorHandlerService);
  private dialog = inject(MatDialog);
  private mapCache = inject(MapCache);
  protected state = inject(MapSelectionStateService);

  mapId = 'timeseries';

  baseMaps: Map<string, LayerOptions> = new Map<string, LayerOptions>();

  clusterConfig: MarkerClusterGroupOptions | undefined;

  cluster = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (
      !this.state.selectedService() &&
      this.configSrvc.configuration.defaultService
    ) {
      this.serviceConnector
        .getServices(this.configSrvc.configuration?.defaultService.apiUrl)
        .subscribe({
          next: (services) => {
            const service = services.find(
              (e) =>
                e.id ===
                this.configSrvc.configuration?.defaultService!.serviceId,
            );
            this.state.selectedService.set(service);
            this.cdr.markForCheck();
          },
          error: (error) => this.errorHandler.error(error),
        });
    }
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
    if (this.state.selectedService()) {
      this.cdr.markForCheck();
      const dialogRef = this.dialog.open(
        ModalDatasetByStationSelectorComponent,
        {
          minHeight: '80vh',
          minWidth: '80vh',
        },
      );
      dialogRef.componentRef?.setInput('station', station);
      dialogRef.componentRef?.setInput(
        'url',
        this.state.selectedService()!.apiUrl,
      );
      dialogRef.componentRef?.setInput(
        'phenomenonId',
        this.state.selectedPhenomenonId(),
      );

      dialogRef.afterClosed().subscribe((newConf: MapConfig) => {
        if (newConf) {
          this.cluster = newConf.cluster;
          this.state.selectedService.set(newConf.selectedService);
          this.cdr.markForCheck();
        }
      });
    }
  }

  openMapSettings() {
    if (this.state.selectedService()) {
      const conf: MapConfig = {
        cluster: this.cluster,
        selectedService: this.state.selectedService()!,
      };
      const dialogRef = this.dialog.open(ModalMapSettingsComponent, {
        data: conf,
      });
      dialogRef.afterClosed().subscribe((newConf: MapConfig) => {
        if (newConf) {
          this.cluster = newConf.cluster;
          this.state.selectedService.set(newConf.selectedService);
          this.state.selectedPhenomenonId.set(undefined);
          this.cdr.markForCheck();
        }
      });
    }
  }
}
