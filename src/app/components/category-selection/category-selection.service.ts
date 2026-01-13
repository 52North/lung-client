import { inject, Injectable, resource, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  HelgolandPlatform,
  StaFilter,
  StaInterfaceService,
  Thing,
  ThingExpandParams,
  ThingSelectParams,
} from '@helgoland/core';
import { firstValueFrom, map, Observable, of } from 'rxjs';
import { ConfigurationService } from '../../services/configuration.service';
import { ModalDatasetByStationSelectorComponent } from '../modal-dataset-by-station-selector/modal-dataset-by-station-selector.component';

const CAT_ONE_PROP = 'gew_art';
const CAT_TWO_PROP = 'kat1';
const CAT_THREE_PROP = 'kat2';
const CAT_FOUR_PROP = 'matrix';
interface ParamsState {
  catOne?: string;
  catTwo?: string;
  catThree?: string;
  catFour?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategorySelectionService {
  private staSrvc = inject(StaInterfaceService);
  private configSrvc = inject(ConfigurationService);
  private dialog = inject(MatDialog);

  private staUrl = this.configSrvc.configuration.defaultService.apiUrl;

  private params = signal<ParamsState>({});

  stationsResource = resource({
    params: this.params,
    loader: ({ params }) => firstValueFrom(this.getStations(params)),
  });

  categoryOneResource = resource({
    loader: () => firstValueFrom(this.getCategoryOne()),
  });

  categoryTwoResource = resource({
    params: this.params,
    loader: ({ params }) => firstValueFrom(this.getCategoryTwo(params)),
  });

  categoryThreeResource = resource({
    params: this.params,
    loader: ({ params }) => firstValueFrom(this.getCategoryThree(params)),
  });

  categoryFourResource = resource({
    params: this.params,
    loader: ({ params }) => firstValueFrom(this.getCategoryFour(params)),
  });

  get selection() {
    return this.params.asReadonly();
  }

  openStation(thing: Thing) {
    this.staSrvc
      .getThing(this.staUrl, thing['@iot.id'], {
        $select: 'Locations',
        $expand: 'Locations($select=id)',
      })
      .subscribe((thingLoc) => {
        if (thingLoc.Locations && thingLoc.Locations.length === 1) {
          const label = thing.description || '';
          const locId = thingLoc.Locations[0]['@iot.id'];
          const platform = new HelgolandPlatform(locId, label, []);
          const dialogRef = this.dialog.open(
            ModalDatasetByStationSelectorComponent,
            {
              minWidth: '80vh',
              width:'80vh'
            }
          );
          dialogRef.componentRef?.setInput('station', platform);
          dialogRef.componentRef?.setInput('url', this.staUrl);
        }
      });
  }

  selectCatOne(cat: string) {
    this.params.set({
      catOne: cat,
    });
  }

  selectCatTwo(cat: string) {
    this.params.update((old) => ({
      catOne: old.catOne,
      catTwo: cat,
    }));
  }

  selectCatThree(cat: string) {
    this.params.update((old) => ({
      catOne: old.catOne,
      catTwo: old.catTwo,
      catThree: cat,
    }));
  }

  selectCatFour(cat: string) {
    this.params.update((old) => ({
      catOne: old.catOne,
      catTwo: old.catTwo,
      catThree: old.catThree,
      catFour: cat,
    }));
  }

  private getStations(params: ParamsState): Observable<Thing[]> {
    const queryParams: StaFilter<ThingSelectParams, ThingExpandParams> = {
      $select: `id,description`,
      $top: 10000,
    };
    if (params.catOne && params.catTwo && params.catThree && params.catFour) {
      queryParams.$filter = `'${params.catOne}' in properties/${CAT_ONE_PROP} and '${params.catTwo}' in properties/${CAT_TWO_PROP} and '${params.catThree}' in properties/${CAT_THREE_PROP} and '${params.catFour}' in properties/${CAT_FOUR_PROP}`;
    } else if (params.catOne && params.catTwo && params.catThree) {
      queryParams.$filter = `'${params.catOne}' in properties/${CAT_ONE_PROP} and '${params.catTwo}' in properties/${CAT_TWO_PROP} and '${params.catThree}' in properties/${CAT_THREE_PROP}`;
    } else if (params.catOne && params.catTwo) {
      queryParams.$filter = `'${params.catOne}' in properties/${CAT_ONE_PROP} and '${params.catTwo}' in properties/${CAT_TWO_PROP}`;
    } else if (params.catOne) {
      queryParams.$filter = `'${params.catOne}' in properties/${CAT_ONE_PROP}`;
    }

    return this.staSrvc
      .getThings(this.staUrl, queryParams)
      .pipe(map((res) => res.value));
  }

  private getCategoryOne() {
    return this.staSrvc
      .getThings(this.staUrl, {
        $select: `distinct:properties/${CAT_ONE_PROP}`,
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

  private getCategoryTwo(params: ParamsState) {
    if (params.catOne) {
      return this.staSrvc
        .getThings(this.staUrl, {
          $select: `distinct:properties/${CAT_TWO_PROP}`,
          $filter: `'${params.catOne}' in properties/${CAT_ONE_PROP}`,
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
    } else {
      return of([]);
    }
  }

  private getCategoryThree(params: ParamsState) {
    if (params.catOne && params.catTwo) {
      return this.staSrvc
        .getThings(this.staUrl, {
          $select: `distinct:properties/${CAT_THREE_PROP}`,
          $filter: `'${params.catOne}' in properties/${CAT_ONE_PROP} and '${params.catTwo}' in properties/${CAT_TWO_PROP}`,
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

  private getCategoryFour(params: ParamsState): Observable<string[]> {
    if (params.catOne && params.catTwo && params.catThree) {
      return this.staSrvc
        .getThings(this.staUrl, {
          $select: `distinct:properties/${CAT_FOUR_PROP}`,
          $filter: `'${params.catOne}' in properties/${CAT_ONE_PROP} and '${params.catTwo}' in properties/${CAT_TWO_PROP} and '${params.catThree}' in properties/${CAT_THREE_PROP}`,
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
}
