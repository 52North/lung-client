import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SeriesGraphDataset } from '@helgoland/d3';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { FavoriteService } from '../../../services/favorite.service';
import { NotifierService } from '../../../services/notifier.service';

@Component({
  selector: 'helgoland-favorite-toggle-button',
  templateUrl: './favorite-toggle-button.component.html',
  styleUrls: ['./favorite-toggle-button.component.scss'],
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslateModule],
})
export class FavoriteToggleButtonComponent implements OnInit {
  protected favSrvc = inject(FavoriteService);
  protected translate = inject(TranslateService);
  protected notifier = inject(NotifierService);

  readonly dataset = input.required<SeriesGraphDataset>();

  // a signal: countChange fires outside any event handler, and without zone.js
  // a plain field would leave icon and name on the old state
  isFavorite = signal(false);

  /** Named by what a click does, so the name carries the state (WCAG 4.1.2). */
  protected labelKey = computed(() =>
    this.isFavorite()
      ? 'favorite-toggle-button.remove'
      : 'favorite-toggle-button.tooltip',
  );
  canBeFavorite = false;

  ngOnInit(): void {
    this.canBeFavorite = this.favSrvc.canBeFavorite(this.dataset()?.id);
    if (this.canBeFavorite) {
      this.checkFavState();
      this.favSrvc.countChange.subscribe((_) => this.checkFavState());
    }
  }

  private checkFavState() {
    this.isFavorite.set(this.favSrvc.isFavorite(this.dataset()?.id));
  }

  toggle() {
    if (this.isFavorite()) {
      this.removeFavorite();
    } else {
      this.createFavorite();
    }
  }

  protected createFavorite() {
    const dataset = this.dataset();
    this.favSrvc.createFavorite(dataset);
    this.isFavorite.set(true);
    this.inform(
      `${this.translate.instant('events.add-favorite')}: ${
        dataset.description.phenomenonLabel
      } @ ${dataset.description.platformLabel}`,
    );
  }

  protected removeFavorite() {
    const dataset = this.dataset();
    this.favSrvc.removeFavorite(dataset.id);
    this.isFavorite.set(false);
    this.inform(
      `${this.translate.instant('events.remove-favorite')}: ${
        dataset.description.phenomenonLabel
      } @ ${dataset.description.platformLabel}`,
    );
  }

  private inform(message: string) {
    this.notifier.notify(message);
  }
}
