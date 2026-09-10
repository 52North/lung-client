import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CategorySelectionActiveToggleComponent } from '../../../components/category-selection/active-toggle/active-toggle.component';
import { CategorySelectionService } from '../../../components/category-selection/category-selection.service';
import { DataLanguageDirective } from '../../../helper/data-language.directive';

@Component({
  selector: 'app-list-selection-menu',
  templateUrl: './list-selection-menu.component.html',
  styleUrls: ['./list-selection-menu.component.scss'],
  imports: [
    DataLanguageDirective,
    TranslateModule,
    CategorySelectionActiveToggleComponent,
  ],
})
export class ListSelectionMenuComponent {
  protected srvc = inject(CategorySelectionService);
}
