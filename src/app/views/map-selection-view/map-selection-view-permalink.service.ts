import { inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HelgolandPlatform, StaInterfaceService } from '@helgoland/core';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError,
  EMPTY,
  filter,
  map,
  Observable,
  switchMap,
  take,
} from 'rxjs';

import { ConfigurationService } from '../../services/configuration.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { SelectedDataSourceService } from '../../services/selected-data-source.service';
import { MapSelectionStateService } from './map-selection-state.service';

const PARAM_STATION = 'station';
const PARAM_SEARCH = 'search';
const PARAM_PHENOMENON = 'phenomenon';
const PARAM_ACTIVE = 'active';
const PARAM_SERVICE = 'service';
const PARAM_API = 'api';

/** Read by `src/main.ts` before routing starts, so a share link keeps it. */
const PARAM_LOCALE = 'locale';

const OWN_PARAMS = [
  PARAM_STATION,
  PARAM_SEARCH,
  PARAM_PHENOMENON,
  PARAM_ACTIVE,
  PARAM_SERVICE,
  PARAM_API,
];

/**
 * Turns the map selection - the station whose dialog is open, the phenomenon
 * search, the selected phenomenon, the active toggle and the chosen data source
 * - into a link and back, mirroring `ListSelectionViewInitStateService`.
 */
@Injectable({
  providedIn: 'root',
})
export class MapSelectionViewInitStateService {
  private state = inject(MapSelectionStateService);
  private selectedDataSource = inject(SelectedDataSourceService);
  private configSrvc = inject(ConfigurationService);
  private activatedRoute = inject(ActivatedRoute);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private staSrvc = inject(StaInterfaceService);

  // The selected service arrives asynchronously - either from the default
  // source loaded in `SelectedDataSourceService`, or from the one named in the
  // link. Initialized here because `toObservable` needs an injection context.
  private service$ = toObservable(this.selectedDataSource.selectedService);

  // Handed to `helgoland-share-button` as a value, so it has to stay a property.
  generatePermalink = (): string => {
    const url = new URL(window.location.href);
    const locale = url.searchParams.get(PARAM_LOCALE);
    url.search = '';
    url.hash = '';

    const params = new URLSearchParams();
    if (locale) {
      params.set(PARAM_LOCALE, locale);
    }

    const station = this.state.currentStationId();
    if (station) {
      params.set(PARAM_STATION, station);
    }

    const phenomenon = this.state.selectedPhenomenonId();
    if (phenomenon) {
      params.set(PARAM_PHENOMENON, phenomenon);
    }

    const search = this.state.searchTerm();
    if (search) {
      params.set(PARAM_SEARCH, search);
    }

    // Defaults stay out of the link, so the common case stays readable.
    if (!this.state.showActiveOnly()) {
      params.set(PARAM_ACTIVE, 'false');
    }

    const service = this.selectedDataSource.selectedService();
    const defaultService = this.configSrvc.configuration?.defaultService;
    if (
      service &&
      (service.id !== defaultService?.serviceId ||
        service.apiUrl !== defaultService?.apiUrl)
    ) {
      params.set(PARAM_SERVICE, service.id);
      params.set(PARAM_API, service.apiUrl);
    }

    url.search = params.toString();
    return url.href;
  };

  /**
   * Applies a shared link. Called from the constructor of the routed component:
   * at that point the router has written the browser url and filled the
   * snapshot, but the sidebar menu does not exist yet and the phenomena have not
   * loaded - so the state is in place before anything reads it.
   *
   * Returns the station to open, if the link names one. Resolving it waits for
   * the data source but not for the map: the dialog looks the station up by id
   * itself, so the markers do not have to be drawn yet.
   */
  applyFromUrl(): Observable<HelgolandPlatform> | undefined {
    const params = this.activatedRoute.snapshot.queryParamMap;
    const present = OWN_PARAMS.filter((param) => params.has(param));
    if (present.length === 0) {
      return undefined;
    }

    const api = params.get(PARAM_API);
    const service = params.get(PARAM_SERVICE);
    if (api && service && !this.selectedDataSource.selectById(api, service)) {
      this.errorHandler.error(
        this.translate.instant('permalink.unknown-data-source'),
      );
    }

    const active = params.get(PARAM_ACTIVE);
    this.state.restoreState({
      phenomenonId: params.get(PARAM_PHENOMENON) ?? undefined,
      searchTerm: params.get(PARAM_SEARCH) ?? undefined,
      showActiveOnly: active === null ? undefined : active !== 'false',
    });

    const stationId = params.get(PARAM_STATION);

    this.removeQueryParams(present);

    return stationId ? this.resolveStation(stationId) : undefined;
  }

  private resolveStation(stationId: string): Observable<HelgolandPlatform> {
    return this.service$.pipe(
      filter((srvc) => !!srvc),
      take(1),
      switchMap((srvc) =>
        this.staSrvc.getLocation(srvc.apiUrl, stationId, {
          $select: 'id,name',
        }),
      ),
      map((loc) => new HelgolandPlatform(loc['@iot.id'], loc.name || '', [])),
      // Reported, then swallowed: a bad station id in a link must not surface as
      // an unhandled error on top of the message the user already got.
      catchError((error) => {
        this.errorHandler.error(
          this.translate.instant('permalink.station-not-found', {
            station: stationId,
          }),
          error,
        );
        return EMPTY;
      }),
    );
  }

  /**
   * Drops the consumed parameters, one by one so that `locale` survives. Without
   * this the address bar would keep claiming a state that the next click on a
   * phenomenon already invalidated, and coming back to the view would silently
   * reset the selection to the one from the link.
   */
  private removeQueryParams(params: string[]): void {
    const url = new URL(window.location.href);
    params.forEach((param) => url.searchParams.delete(param));
    history.replaceState(history.state, '', url.href);
  }
}
