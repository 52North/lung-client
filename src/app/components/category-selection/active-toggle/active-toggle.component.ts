import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { CategorySelectionService } from '../category-selection.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-category-selection-active-toggle',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './active-toggle.component.html',
  styleUrls: ['./active-toggle.component.scss'],
})
export class CategorySelectionActiveToggleComponent {
  private categorySelection = inject(CategorySelectionService);

  readonly showActive = this.categorySelection.showActiveOnly;

  onChange(event: MatSlideToggleChange) {
    this.categorySelection.setShowActiveOnly(event.checked);
  }
}
