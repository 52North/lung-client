import { Component } from '@angular/core';

import { CategorySelectionComponent } from '../../components/category-selection/category-selection.component';

@Component({
  selector: 'helgoland-list-selection-view',
  templateUrl: './list-selection-view.component.html',
  styleUrls: ['./list-selection-view.component.scss'],
  imports: [CategorySelectionComponent],
})
export class ListSelectionViewComponent {}
