import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { CategorySelectionService } from './category-selection.service';
import { DataLanguageDirective } from '../../helper/data-language.directive';

@Component({
  selector: 'app-category-selection',
  templateUrl: './category-selection.component.html',
  styleUrls: ['./category-selection.component.scss'],
  imports: [
    DataLanguageDirective,
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    TranslateModule,
    MatInputModule,
  ],
})
export class CategorySelectionComponent {
  protected srvc = inject(CategorySelectionService);

  protected filteredStations = computed(() => {
    const stations = this.srvc.stationsResource.value();
    const filter = this._normalizeValue(this.srvc.searchTerm());
    return stations?.filter(
      (i) =>
        i.description && this._normalizeValue(i.description).includes(filter),
    );
  });

  private stationList = viewChild<ElementRef<HTMLElement>>('stationList');

  // Roving tabindex: the station list is a single tab stop, the arrow keys move
  // within it. Without this the list adds one tab stop per station - 1120 of
  // them at the time of writing, which is not a reasonable way past the list
  // (WCAG 2.4.1).
  private _rovingIndex = signal(0);

  // Never point past the end of the list. Filtering, a category change or the
  // "active only" toggle all shorten it, and a stale index would leave the list
  // without any tab stop at all.
  protected rovingIndex = computed(() => {
    const count = this.filteredStations()?.length ?? 0;
    return count === 0 ? 0 : Math.min(this._rovingIndex(), count - 1);
  });

  protected onInput(event: Event) {
    this.srvc.setSearchTerm((event.target as HTMLInputElement).value);
    // Start over at the top of the new result set rather than somewhere in its
    // middle, where the clamped index would point at an unrelated station.
    this._rovingIndex.set(0);
  }

  protected onEntryFocus(index: number) {
    this._rovingIndex.set(index);
  }

  protected onListKeydown(event: KeyboardEvent) {
    const count = this.filteredStations()?.length ?? 0;
    if (count === 0) {
      return;
    }
    const current = this.rovingIndex();
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(current + 1, count - 1);
        break;
      case 'ArrowUp':
        next = Math.max(current - 1, 0);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this._rovingIndex.set(next);
    this.stationList()
      ?.nativeElement.querySelectorAll<HTMLElement>('.station-entry')
      [next]?.focus();
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }
}
