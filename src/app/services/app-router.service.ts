import { Injectable, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { ListSelectionComponent } from '../components/list-selection/list-selection.component';
import { MapSelectionComponent } from './../components/map-selection/map-selection.component';

export const MAP_SELECTION_ROUTE = 'map-selection';
export const LIST_SELECTION_ROUTE = 'list-selection';
export const TABLE_VIEW_ROUTE = 'table';

@Injectable({
  providedIn: 'root',
})
export class AppRouterService {
  private router = inject(Router);
  private dialog = inject(MatDialog);

  isTableView: Signal<boolean> = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
      map((url) => url === '/' + TABLE_VIEW_ROUTE || url === TABLE_VIEW_ROUTE),
    ),
    { requireSync: true },
  );

  constructor() {
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        if (val.url.indexOf(LIST_SELECTION_ROUTE) > -1) {
          this.openListSelection();
        }
        if (val.url.indexOf(MAP_SELECTION_ROUTE) > -1) {
          this.openMapSelection();
        }
      }
    });
  }

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

  resetNavigation() {
    this.router.navigate(['']);
  }

  private openMapSelection() {
    const dialogRef = this.dialog.open(MapSelectionComponent, {
      autoFocus: false,
      panelClass: 'modal-map-selection',
    });
    dialogRef.afterClosed().subscribe((res) => this.resetNavigation());
  }

  private openListSelection() {
    const dialogRef = this.dialog.open(ListSelectionComponent, {
      autoFocus: false,
      minWidth: '1000px',
      height: '80%',
    });
    dialogRef.afterClosed().subscribe((res) => this.resetNavigation());
  }
}
