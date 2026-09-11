import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { ShareButtonComponent } from '../../../components/share-button/share-button.component';
import { MapSelectionStateService } from '../map-selection-state.service';
import { MapSelectionViewInitStateService } from '../map-selection-view-permalink.service';
import { ParameterListSelectorComponent } from '../parameter-list-selector/parameter-list-selector.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-map-selection-menu',
  templateUrl: './map-selection-menu.component.html',
  styleUrls: ['./map-selection-menu.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    MatSlideToggle,
    ParameterListSelectorComponent,
    ShareButtonComponent,
  ],
})
export class MapSelectionMenuComponent {
  protected state = inject(MapSelectionStateService);
  protected permalink = inject(MapSelectionViewInitStateService);
}
