import { computed, inject, Injectable, resource, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  HelgolandPlatform,
  StaFilter,
  StaInterfaceService,
  Thing,
  ThingExpandParams,
  ThingSelectParams,
} from '@helgoland/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, map, Observable, of } from 'rxjs';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { SelectedDataSourceService } from '../../services/selected-data-source.service';
import {
  ModalDatasetByStationSelectorComponent,
  STATION_DIALOG_CONFIG,
} from '../modal-dataset-by-station-selector/modal-dataset-by-station-selector.component';

const CAT_ONE_PROP = 'gew_art';
const CAT_TWO_PROP = 'kat1';
const CAT_THREE_PROP = 'kat2';
const CAT_FOUR_PROP = 'matrix';

export interface CategorySelectionState {
  showActiveOnly?: boolean;
  categoryOne?: string;
  categoryTwo?: string;
  categoryThree?: string;
  categoryFour?: string;
  searchTerm?: string;
}

interface RequestParams {
  url: string | undefined;
  categoryOne?: string;
  categoryTwo?: string;
  categoryThree?: string;
  categoryFour?: string;
  showActiveOnly?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CategorySelectionService {
  private staSrvc = inject(StaInterfaceService);
  private selectedDataSourceSrvc = inject(SelectedDataSourceService);
  private dialog = inject(MatDialog);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);

  private staUrl = computed(
    () => this.selectedDataSourceSrvc.selectedService()?.apiUrl,
  );

  private categoryOne = signal<string | undefined>(undefined);
  private categoryTwo = signal<string | undefined>(undefined);
  private categoryThree = signal<string | undefined>(undefined);
  private categoryFour = signal<string | undefined>(undefined);

  private _showActiveOnly = signal(true);

  private _searchTerm = signal('');

  get showActiveOnly() {
    return this._showActiveOnly.asReadonly();
  }

  get searchTerm() {
    return this._searchTerm.asReadonly();
  }

  setShowActiveOnly(value: boolean) {
    this.categoryOne.set(undefined);
    this.categoryTwo.set(undefined);
    this.categoryThree.set(undefined);
    this.categoryFour.set(undefined);
    this._showActiveOnly.set(value);
  }

  setSearchTerm(value: string) {
    this._searchTerm.set(value);
  }

  stationsResource = resource({
    params: computed<RequestParams>(() => ({
      url: this.staUrl(),
      categoryOne: this.categoryOne(),
      categoryTwo: this.categoryTwo(),
      categoryThree: this.categoryThree(),
      categoryFour: this.categoryFour(),
      showActiveOnly: this._showActiveOnly(),
    })),
    loader: ({ params }) => firstValueFrom(this.getStations(params)),
  });

  categoryOneResource = resource({
    params: computed(() => ({
      url: this.staUrl(),
      showActiveOnly: this._showActiveOnly(),
    })),
    loader: ({ params }) => firstValueFrom(this.getCategoryOne(params)),
  });

  categoryTwoResource = resource({
    params: computed(() => ({
      url: this.staUrl(),
      categoryOne: this.categoryOne(),
      showActiveOnly: this._showActiveOnly(),
    })),
    loader: ({ params }) => firstValueFrom(this.getCategoryTwo(params)),
  });

  categoryThreeResource = resource({
    params: computed(() => ({
      url: this.staUrl(),
      categoryOne: this.categoryOne(),
      categoryTwo: this.categoryTwo(),
      showActiveOnly: this._showActiveOnly(),
    })),
    loader: ({ params }) => firstValueFrom(this.getCategoryThree(params)),
  });

  categoryFourResource = resource({
    params: computed(() => ({
      url: this.staUrl(),
      categoryOne: this.categoryOne(),
      categoryTwo: this.categoryTwo(),
      categoryThree: this.categoryThree(),
      showActiveOnly: this._showActiveOnly(),
    })),
    loader: ({ params }) => firstValueFrom(this.getCategoryFour(params)),
  });

  get selectedCategoryOne() {
    return this.categoryOne.asReadonly();
  }

  get selectedCategoryTwo() {
    return this.categoryTwo.asReadonly();
  }

  get selectedCategoryThree() {
    return this.categoryThree.asReadonly();
  }

  get selectedCategoryFour() {
    return this.categoryFour.asReadonly();
  }

  openStation(thing: Thing) {
    const url = this.staUrl();
    if (!url) {
      this.errorHandler.error(
        this.translate.instant('category-selection.no-data-source'),
      );
      return;
    }
    this.staSrvc
      .getThing(url, thing['@iot.id'], {
        $select: 'Locations',
        $expand: 'Locations($select=id)',
      })
      .subscribe({
        next: (thingLoc) => {
          if (!thingLoc.Locations || thingLoc.Locations.length !== 1) {
            this.errorHandler.error(
              this.translate.instant(
                'category-selection.station-not-openable',
                {
                  station: thing.description || thing['@iot.id'],
                },
              ),
            );
            return;
          }
          const label = thing.description || '';
          const locId = thingLoc.Locations[0]['@iot.id'];
          const platform = new HelgolandPlatform(locId, label, []);
          const dialogRef = this.dialog.open(
            ModalDatasetByStationSelectorComponent,
            STATION_DIALOG_CONFIG,
          );
          dialogRef.componentRef?.setInput('station', platform);
          dialogRef.componentRef?.setInput('url', url);
          dialogRef.componentRef?.setInput('filterProperty', {
            property: CAT_FOUR_PROP,
            value: this.categoryFour(),
          });
        },
        error: (error) =>
          this.errorHandler.error(
            this.translate.instant('category-selection.error-loading-station', {
              station: thing.description || thing['@iot.id'],
            }),
            error,
          ),
      });
  }

  /**
   * Applies a whole selection at once, as it arrives from a shared link.
   *
   * Writes the signals directly instead of going through `setShowActiveOnly`,
   * whose category reset would make the result depend on the order of the
   * assignments here. A level is only taken over when the one above it is
   * present as well: a link carrying a second category but no first one would
   * otherwise filter against a value that is nowhere visible in the ui.
   */
  restoreState(state: CategorySelectionState) {
    if (state.showActiveOnly !== undefined) {
      this._showActiveOnly.set(state.showActiveOnly);
    }

    const one = state.categoryOne;
    const two = one ? state.categoryTwo : undefined;
    const three = two ? state.categoryThree : undefined;
    const four = three ? state.categoryFour : undefined;

    this.categoryOne.set(one);
    this.categoryTwo.set(two);
    this.categoryThree.set(three);
    this.categoryFour.set(four);

    if (state.searchTerm !== undefined) {
      this._searchTerm.set(state.searchTerm);
    }
  }

  selectCatOne(cat: string) {
    this.categoryOne.set(cat);
  }

  selectCatTwo(cat: string) {
    this.categoryTwo.set(cat);
  }

  selectCatThree(cat: string) {
    this.categoryThree.set(cat);
  }

  selectCatFour(cat: string) {
    this.categoryFour.set(cat);
  }

  private getStations(params: RequestParams): Observable<Thing[]> {
    if (!params.url) return of([]);
    const filter = this.createThingFilter(params);

    const queryParams: StaFilter<ThingSelectParams, ThingExpandParams> = {
      $select: `id,description`,
      $filter: filter,
      $top: 10000,
    };

    return this.staSrvc
      .getThings(params.url, queryParams)
      .pipe(map((res) => res.value));
  }

  private getCategoryOne(params: RequestParams) {
    if (!params.url) return of([]);
    return this.staSrvc
      .getThings(params.url, {
        $select: `distinct:properties/${CAT_ONE_PROP}`,
        $filter: this.createThingFilter(params),
      })
      .pipe(
        map((res) =>
          res.value
            .map((e) => {
              if (e.properties && e.properties[CAT_ONE_PROP]) {
                return e.properties[CAT_ONE_PROP] as string;
              } else {
                return undefined;
              }
            })
            .filter((e) => e !== undefined),
        ),
      );
  }

  private getCategoryTwo(params: RequestParams) {
    if (params.url && params.categoryOne) {
      return this.staSrvc
        .getThings(params.url, {
          $select: `distinct:properties/${CAT_TWO_PROP}`,
          $filter: this.createThingFilter(params),
        })
        .pipe(
          map((res) =>
            res.value
              .map((e) => {
                if (e.properties && e.properties[CAT_TWO_PROP]) {
                  return e.properties[CAT_TWO_PROP] as string[];
                } else {
                  return undefined;
                }
              })
              .filter((e) => e !== undefined)
              .flat(),
          ),
        );
    }
    return of([]);
  }

  private getCategoryThree(params: RequestParams) {
    if (params.url && params.categoryOne && params.categoryTwo) {
      return this.staSrvc
        .getThings(params.url, {
          $select: `distinct:properties/${CAT_THREE_PROP}`,
          $filter: this.createThingFilter(params),
        })
        .pipe(
          map((res) =>
            res.value
              .map((e) => {
                if (e.properties && e.properties[CAT_THREE_PROP]) {
                  return e.properties[CAT_THREE_PROP] as string[];
                } else {
                  return undefined;
                }
              })
              .filter((e) => e !== undefined)
              .flat(),
          ),
        );
    }
    return of([]);
  }

  private getCategoryFour(params: RequestParams): Observable<string[]> {
    if (
      params.url &&
      params.categoryOne &&
      params.categoryTwo &&
      params.categoryThree
    ) {
      return this.staSrvc
        .getThings(params.url, {
          $select: `distinct:properties/${CAT_FOUR_PROP}`,
          $filter: this.createThingFilter(params),
        })
        .pipe(
          map((res) => {
            const entries = new Set<string>();
            res.value.forEach((e) => {
              if (
                e.properties &&
                e.properties[CAT_FOUR_PROP] &&
                e.properties[CAT_FOUR_PROP].length
              ) {
                (e.properties[CAT_FOUR_PROP] as string[]).forEach((s) =>
                  entries.add(s),
                );
              }
            });
            return Array.from(entries);
          }),
        );
    }
    return of([]);
  }

  private createThingFilter({
    showActiveOnly,
    categoryOne,
    categoryTwo,
    categoryThree,
    categoryFour,
  }: RequestParams) {
    const filter: string[] = [];

    showActiveOnly && filter.push(`properties/active eq true`);

    categoryOne &&
      filter.push(`'${categoryOne}' in properties/${CAT_ONE_PROP}`);
    categoryTwo &&
      filter.push(`'${categoryTwo}' in properties/${CAT_TWO_PROP}`);
    categoryThree &&
      filter.push(`'${categoryThree}' in properties/${CAT_THREE_PROP}`);
    categoryFour &&
      filter.push(`'${categoryFour}' in properties/${CAT_FOUR_PROP}`);

    return filter.length ? filter.join(' and ') : undefined;
  }
}
