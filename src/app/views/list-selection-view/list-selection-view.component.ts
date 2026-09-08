import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { CategorySelectionComponent } from '../../components/category-selection/category-selection.component';

@Component({
  selector: 'helgoland-list-selection-view',
  templateUrl: './list-selection-view.component.html',
  styleUrls: ['./list-selection-view.component.scss'],
  imports: [CategorySelectionComponent, TranslateModule],
})
export class ListSelectionViewComponent {}
