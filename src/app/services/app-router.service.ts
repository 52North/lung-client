import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, pairwise, startWith } from 'rxjs';

export const MAP_SELECTION_ROUTE = 'map-selection';
export const LIST_SELECTION_ROUTE = 'list-selection';
export const TABLE_VIEW_ROUTE = 'table';

@Injectable({
  providedIn: 'root',
})
export class AppRouterService {
  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { requireSync: true },
  );

  private previousUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
      pairwise(),
      map(([prev]) => prev),
    ),
    { initialValue: '' },
  );

  isTableView = computed(() => {
    const url = this.currentUrl();
    return url === '/' + TABLE_VIEW_ROUTE || url === TABLE_VIEW_ROUTE;
  });

  isMapSelection = computed(() => {
    const url = this.currentUrl();
    return url === '/' + MAP_SELECTION_ROUTE || url === MAP_SELECTION_ROUTE;
  });

  isListSelection = computed(() => {
    const url = this.currentUrl();
    return url === '/' + LIST_SELECTION_ROUTE || url === LIST_SELECTION_ROUTE;
  });

  toDiagram() {
    this.router.navigate(['']);
  }

  toTable() {
    this.router.navigate([TABLE_VIEW_ROUTE]);
  }

  toMapSelection() {
    if (this.router.url.indexOf(LIST_SELECTION_ROUTE) === -1) {
      this.router.navigate([MAP_SELECTION_ROUTE]);
    }
  }

  toListSelection() {
    if (this.router.url.indexOf(MAP_SELECTION_ROUTE) === -1) {
      this.router.navigate([LIST_SELECTION_ROUTE]);
    }
  }

  back() {
    const prev = this.previousUrl();
    if (
      prev &&
      prev !== '/' + LIST_SELECTION_ROUTE &&
      prev !== LIST_SELECTION_ROUTE
    ) {
      this.router.navigateByUrl(prev);
    } else {
      this.router.navigate(['']);
    }
  }
}
