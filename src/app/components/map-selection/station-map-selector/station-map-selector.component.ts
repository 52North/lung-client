import 'leaflet.markercluster';

import {
  afterNextRender,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  DatasetType,
  HelgolandParameterFilter,
  HelgolandPlatform,
  HelgolandServicesConnector,
  HelgolandTimeseries,
  Location,
  LocationExpandParams,
  LocationSelectParams,
  StaFilter,
  StaInterfaceService,
  StatusIntervalResolverService,
  TimeseriesExtras,
} from '@helgoland/core';
import { HelgolandMapModule, MapSelectorComponent } from '@helgoland/map';
import GeoJSON from 'geojson';
import L, { Layer } from 'leaflet';
import { forkJoin, map, Observable } from 'rxjs';
import {
  AppConfig,
  ConfigurationService,
} from '../../../services/configuration.service';

@Component({
  selector: 'station-map-selector',
  templateUrl: 'station-map-selector.component.html',
  styleUrls: ['station-map-selector.component.scss'],
  imports: [HelgolandMapModule],
  standalone: true,
})
export class StationMapSelectorComponent
  extends MapSelectorComponent<HelgolandPlatform>
  implements OnChanges, AfterViewInit {
  protected statusIntervalResolver = inject(StatusIntervalResolverService);
  protected servicesConnector = inject(HelgolandServicesConnector);
  private staSrvc = inject(StaInterfaceService);
  private configSrvc =
    inject<ConfigurationService<AppConfig>>(ConfigurationService);

  readonly cluster = input<boolean>();

  readonly clusterConfig = input<L.MarkerClusterGroupOptions>();

  readonly statusIntervals = input<boolean>();

  readonly showOnlyActive = input<boolean>();

  readonly ignoreStatusIntervalIfBeforeDuration = input(Infinity);

  constructor() {
    super();
    effect(() => {
      this.showOnlyActive();
      if (this.map && this.serviceUrl()) {
        this.drawGeometries(this.map, this.serviceUrl()!);
      }
    });
  }

  protected markerFeatureGroup: L.FeatureGroup | undefined;

  override ngOnChanges(changes: SimpleChanges) {
    super.ngOnChanges(changes);
    const serviceUrl = this.serviceUrl();
    if (this.map && serviceUrl && changes['statusIntervals']) {
      this.drawGeometries(this.map, serviceUrl);
    }
    this.cd.markForCheck();
  }

  protected drawGeometries(map: L.Map, serviceUrl: string) {
    this.onContentLoading.emit(true);
    if (this.markerFeatureGroup) {
      map.removeLayer(this.markerFeatureGroup);
    }
    const filter = this.filter();
    if (this.statusIntervals() && filter && filter.phenomenon) {
      this.createValuedMarkers(serviceUrl, map);
    } else {
      this.createStationGeometries(serviceUrl, map);
    }
    this.cd.markForCheck();
  }

  protected createValuedMarkers(serviceUrl: string, map: L.Map) {
    this.servicesConnector
      .getDatasets(serviceUrl, {
        phenomenon: this.filter()?.phenomenon,
        expanded: true,
        type: DatasetType.Timeseries,
      })
      .subscribe({
        next: (datasets: HelgolandTimeseries[]) => {
          this.markerFeatureGroup = L.featureGroup();
          const obsList: Array<Observable<TimeseriesExtras>> = [];
          datasets.forEach((ts: HelgolandTimeseries) => {
            const obs = this.servicesConnector.getDatasetExtras(ts.internalId);
            obsList.push(obs);
            obs.subscribe((extras: TimeseriesExtras) => {
              let marker;
              if (extras.statusIntervals) {
                if (
                  ts.lastValue?.timestamp &&
                  ts.lastValue.value &&
                  ts.lastValue.timestamp >
                  new Date().getTime() -
                  this.ignoreStatusIntervalIfBeforeDuration()
                ) {
                  const interval =
                    this.statusIntervalResolver.getMatchingInterval(
                      ts.lastValue.value,
                      extras.statusIntervals,
                    );
                  if (interval) {
                    marker = this.createColoredMarker(
                      ts.platform,
                      interval.color,
                    );
                  }
                }
              }
              if (!marker) {
                marker = this.createDefaultColoredMarker(ts.platform);
              }
              marker.on('click', () => {
                this.onSelected.emit(ts.platform);
              });
              this.markerFeatureGroup!.addLayer(marker);
            });
          });

          forkJoin(obsList).subscribe(() => {
            this.zoomToMarkerBounds(this.markerFeatureGroup!.getBounds(), map);
            map.invalidateSize();
            this.onContentLoading.emit(false);
          });

          this.markerFeatureGroup.addTo(map);
        },
        error: (error) => console.error(error),
      });
  }

  protected createColoredMarker(
    station: HelgolandPlatform,
    color: string,
  ): Layer {
    const markerSelectorGenerator = this.markerSelectorGenerator();
    if (markerSelectorGenerator && markerSelectorGenerator.createFilledMarker) {
      return markerSelectorGenerator.createFilledMarker(station, color);
    }
    return this.createFilledMarker(station, color, 10);
  }

  protected createDefaultColoredMarker(station: HelgolandPlatform): Layer {
    const markerSelectorGenerator = this.markerSelectorGenerator();
    if (
      markerSelectorGenerator &&
      markerSelectorGenerator.createDefaultFilledMarker
    ) {
      return markerSelectorGenerator.createDefaultFilledMarker(station);
    }
    return this.createFilledMarker(station, '#000', 10);
  }

  protected createFilledMarker(
    station: HelgolandPlatform,
    color: string,
    radius: number,
  ): Layer {
    let geometry: Layer;
    if (station.geometry?.type === 'Point') {
      const point = station.geometry as GeoJSON.Point;
      geometry = L.circleMarker([point.coordinates[1], point.coordinates[0]], {
        color: '#000',
        fillColor: color,
        fillOpacity: 0.8,
        radius: 10,
        weight: 2,
      });
    } else {
      geometry = L.geoJSON(station.geometry, {
        style: (feature) => ({
          color: '#000',
          fillColor: color,
          fillOpacity: 0.8,
          weight: 2,
        }),
      });
    }
    if (geometry) {
      geometry.on('click', () => this.onSelected.emit(station));
      return geometry;
    }
    throw new Error('Could not create geometry');
  }

  protected createStationFilter(
    filter?: HelgolandParameterFilter,
  ): StaFilter<LocationSelectParams, LocationExpandParams> {
    const filterParams = [];
    if (this.showOnlyActive()) {
      filterParams.push(`Things/properties/active eq true`);
    }
    if (filter && filter.phenomenon) {
      filterParams.push(
        `Things/Datastreams/ObservedProperty/id eq '${filter.phenomenon}'`,
      );
    }
    return {
      $top: 10000,
      $select: `id,name,location,Things`,
      $filter: filterParams.length > 0 ? filterParams.join(' and ') : undefined,
    };
  }

  protected createHelgolandPlatform(loc: Location): HelgolandPlatform {
    if (loc['@iot.id'] && loc.name) {
      return new HelgolandPlatform(loc['@iot.id'], loc.name, [], loc.location);
    }
    throw new Error('Could not create helgoland platform');
  }

  protected createStationGeometries(serviceUrl: string, lmap: L.Map) {
    const defaultService = this.configSrvc.configuration.defaultService;
    if (defaultService?.apiUrl === serviceUrl) {
      const platformFilter: StaFilter<
        LocationSelectParams,
        LocationExpandParams
      > = this.createStationFilter(this.filter());
      this.staSrvc
        .aggregatePaging(this.staSrvc.getLocations(serviceUrl, platformFilter))
        .pipe(
          map((locs) => locs.value.map((e) => this.createHelgolandPlatform(e))),
        )
        .subscribe({
          next: (platforms) => this.successPlatformLoad(platforms, lmap),
          error: (error) => this.errorPlatformLoad(error, lmap),
        });
    } else {
      this.servicesConnector.getPlatforms(serviceUrl, this.filter()).subscribe({
        next: (res) => this.successPlatformLoad(res, lmap),
        error: (error) => this.errorPlatformLoad(error, lmap),
      });
    }
  }

  private successPlatformLoad(res: HelgolandPlatform[], lmap: L.Map) {
    if (this.cluster()) {
      this.markerFeatureGroup = L.markerClusterGroup({
        animate: true,
        ...this.clusterConfig(),
      });
    } else {
      this.markerFeatureGroup = L.featureGroup();
    }
    if (res instanceof Array && res.length > 0) {
      res.forEach((entry) => {
        const marker = this.createDefaultGeometry(entry);
        if (marker) {
          this.markerFeatureGroup!.addLayer(marker);
        }
      });
      this.markerFeatureGroup.addTo(lmap);
      this.zoomToMarkerBounds(this.markerFeatureGroup.getBounds(), lmap);
    } else {
      this.onNoResultsFound.emit(true);
    }
    lmap.invalidateSize();
    this.onContentLoading.emit(false);
  }

  private errorPlatformLoad(error: any, lmap: L.Map) {
    console.error(error);
    lmap.setView([0, 0], 1);
    this.onContentLoading.emit(false);
  }

  protected createDefaultGeometry(
    station: HelgolandPlatform,
  ): Layer | undefined {
    let layer: Layer | undefined = undefined;
    const markerSelectorGenerator = this.markerSelectorGenerator();
    if (
      markerSelectorGenerator &&
      markerSelectorGenerator.createDefaultGeometry
    ) {
      layer = markerSelectorGenerator.createDefaultGeometry(station);
    } else if (station.geometry) {
      layer = L.geoJSON(station.geometry);
    } else {
      console.error(station.id + ' has no geometry');
    }
    // register click event
    if (layer) {
      layer.on('click', () => this.onSelected.emit(station));
    }
    return layer;
  }
}
