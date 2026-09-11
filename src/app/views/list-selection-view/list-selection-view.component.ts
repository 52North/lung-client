import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { CategorySelectionComponent } from '../../components/category-selection/category-selection.component';
import { ListSelectionViewInitStateService } from './list-selection-view-permalink.service';

@Component({
  selector: 'helgoland-list-selection-view',
  templateUrl: './list-selection-view.component.html',
  styleUrls: ['./list-selection-view.component.scss'],
  imports: [CategorySelectionComponent, TranslateModule],
})
export class ListSelectionViewComponent {
  private initStateService = inject(ListSelectionViewInitStateService);

  constructor() {
    this.initStateService.applyFromUrl();
  }
}
