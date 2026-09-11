import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CategorySelectionActiveToggleComponent } from '../../../components/category-selection/active-toggle/active-toggle.component';
import { CategorySelectionService } from '../../../components/category-selection/category-selection.service';
import { ShareButtonComponent } from '../../../components/share-button/share-button.component';
import { DataLanguageDirective } from '../../../helper/data-language.directive';
import { ListSelectionViewInitStateService } from '../list-selection-view-permalink.service';

@Component({
  selector: 'app-list-selection-menu',
  templateUrl: './list-selection-menu.component.html',
  styleUrls: ['./list-selection-menu.component.scss'],
  imports: [
    DataLanguageDirective,
    TranslateModule,
    CategorySelectionActiveToggleComponent,
    ShareButtonComponent,
  ],
})
export class ListSelectionMenuComponent {
  protected srvc = inject(CategorySelectionService);
  protected permalink = inject(ListSelectionViewInitStateService);
}
