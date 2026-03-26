import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CategorySelectionService } from '../../category-selection/category-selection.service';

@Component({
  selector: 'app-list-selection-menu',
  templateUrl: './list-selection-menu.component.html',
  styleUrls: ['./list-selection-menu.component.scss'],
  imports: [TranslateModule],
})
export class ListSelectionMenuComponent {
  protected srvc = inject(CategorySelectionService);
}
