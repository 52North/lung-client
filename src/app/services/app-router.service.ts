import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, pairwise, startWith } from 'rxjs';

export const MAP_SELECTION_ROUTE = 'map-selection';
export const LIST_SELECTION_ROUTE = 'list-selection';
export const TABLE_VIEW_ROUTE = 'table';

/** Strips query string, fragment and the leading slash from a router url. */
function toPath(url: string): string {
  return url.split(/[?#;]/)[0].replace(/^\//, '');
}

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

  // A share link carries query parameters, so the plain route has to be compared
  // without them - otherwise `/list-selection?cat1=...` would not count as the
  // list selection and its sidebar menu would never be rendered.
  private currentPath = computed(() => toPath(this.currentUrl()));

  isTableView = computed(() => this.currentPath() === TABLE_VIEW_ROUTE);

  isMapSelection = computed(() => this.currentPath() === MAP_SELECTION_ROUTE);

  isListSelection = computed(() => this.currentPath() === LIST_SELECTION_ROUTE);

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
    if (prev && toPath(prev) !== LIST_SELECTION_ROUTE) {
      this.router.navigateByUrl(prev);
    } else {
      this.router.navigate(['']);
    }
  }
}
