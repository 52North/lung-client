import { Routes } from '@angular/router';
import { icon, Marker } from 'leaflet';

export const ROUTES: Routes = [
  {
    path: 'table',
    title: 'view.table.title',
    loadComponent: () =>
      import('./views/table-view/table-view.component').then(
        (m) => m.TableViewComponent,
      ),
  },
  {
    path: 'map-selection',
    title: 'view.map-selection.title',
    loadComponent: () =>
      import('./views/map-selection-view/map-selection.component').then(
        (m) => m.MapSelectionComponent,
      ),
  },
  {
    path: 'list-selection',
    title: 'view.list-selection.title',
    loadComponent: () =>
      import('./views/list-selection-view/list-selection-view.component').then(
        (m) => m.ListSelectionViewComponent,
      ),
  },
  {
    path: '**',
    pathMatch: 'full',
    title: 'view.diagram.title',
    loadComponent: () =>
      import('./views/diagram-view/diagram-view.component').then(
        (m) => m.DiagramViewComponent,
      ),
  },
];

Marker.prototype.options.icon = icon({
  iconRetinaUrl: 'assets/img/marker-icon-2x.png',
  iconUrl: 'assets/img/marker-icon.png',
  shadowUrl: 'assets/img/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
