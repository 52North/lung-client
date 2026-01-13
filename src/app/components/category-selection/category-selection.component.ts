import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { CategorySelectionService } from './category-selection.service';

@Component({
  selector: 'app-category-selection',
  templateUrl: './category-selection.component.html',
  styleUrls: ['./category-selection.component.css'],
  imports: [CommonModule, MatFormFieldModule, TranslateModule, MatInputModule],
})
export class CategorySelectionComponent {
  protected srvc = inject(CategorySelectionService);

  protected filter = signal('');
  protected filteredStations = computed(() => {
    const stations = this.srvc.stationsResource.value();
    const filter = this._normalizeValue(this.filter());
    return stations?.filter(
      (i) =>
        i.description && this._normalizeValue(i.description).includes(filter),
    );
  });

  protected onInput(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }
}
