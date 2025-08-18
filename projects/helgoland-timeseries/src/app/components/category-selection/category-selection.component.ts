import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CategorySelectionService } from './category-selection.service';

@Component({
  selector: 'app-category-selection',
  templateUrl: './category-selection.component.html',
  styleUrls: ['./category-selection.component.css'],
  imports: [CommonModule],
})
export class CategorySelectionComponent {
  protected srvc = inject(CategorySelectionService);
}
