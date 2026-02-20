import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { CategorySelectionService } from '../category-selection.service';

@Component({
  selector: 'app-category-selection-active-toggle',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, TranslateModule],
  templateUrl: './active-toggle.component.html',
  styleUrls: ['./active-toggle.component.scss'],
})
export class CategorySelectionActiveToggleComponent {
  readonly showActive = this.categorySelection.showActiveOnly;

  constructor(private categorySelection: CategorySelectionService) {}

  onChange(event: MatSlideToggleChange) {
    this.categorySelection.setShowActiveOnly(event.checked);
  }
}
