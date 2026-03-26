import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CategorySelectionActiveToggleComponent } from '../../../components/category-selection/active-toggle/active-toggle.component';
import { CategorySelectionService } from '../../../components/category-selection/category-selection.service';

@Component({
  selector: 'app-list-selection-menu',
  templateUrl: './list-selection-menu.component.html',
  styleUrls: ['./list-selection-menu.component.scss'],
  imports: [TranslateModule, CategorySelectionActiveToggleComponent],
})
export class ListSelectionMenuComponent {
  protected srvc = inject(CategorySelectionService);
}
