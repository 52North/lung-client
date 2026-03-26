import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { MapSelectionStateService } from '../map-selection-state.service';
import { ParameterListSelectorComponent } from '../parameter-list-selector/parameter-list-selector.component';

@Component({
  selector: 'app-map-selection-menu',
  templateUrl: './map-selection-menu.component.html',
  styleUrls: ['./map-selection-menu.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    MatSlideToggle,
    ParameterListSelectorComponent,
  ],
})
export class MapSelectionMenuComponent {
  protected state = inject(MapSelectionStateService);
}
