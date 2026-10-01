import {
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { Favorite, FavoriteService } from '../../../services/favorite.service';
import {
  CONFIRM_CLEAR_STORAGE_MESSAGE_ID,
  ConfirmDeletionTexts,
  ModalConfirmClearStorageComponent,
} from '../../clear-storage-button/modal-confirm-clear-storage/modal-confirm-clear-storage.component';
import { EditLabelComponent } from '../../edit-label/edit-label.component';

interface EditableFavorite extends Favorite {
  editMode: boolean;
}

@Component({
  selector: 'helgoland-modal-favorite-list',
  templateUrl: './modal-favorite-list.component.html',
  styleUrls: ['./modal-favorite-list.component.scss'],
  imports: [
    TranslateModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    EditLabelComponent,
  ],
})
export class ModalFavoriteListComponent implements OnInit {
  favoriteSrvc = inject(FavoriteService);
  private dialog = inject(MatDialog);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private injector = inject(Injector);

  // a signal: deleting now happens after the confirmation closes, outside any
  // event handler, and the app runs without zone.js
  singles = signal<EditableFavorite[]>([]);

  ngOnInit(): void {
    this.setFavorites();
  }

  addSingleToDiagram(fav: Favorite) {
    this.favoriteSrvc.addFavoriteToDiagram(fav);
  }

  /** A favorite carries a name of its own and has no undo, so ask first. */
  deleteFav(fav: Favorite) {
    const texts: ConfirmDeletionTexts = {
      title: 'favorites.single-favorite.confirm-delete.title',
      message: 'favorites.single-favorite.confirm-delete.message',
      confirm: 'favorites.single-favorite.confirm-delete.confirm',
      params: { label: fav.label },
    };
    this.dialog
      .open(ModalConfirmClearStorageComponent, {
        width: '400px',
        data: texts,
        ariaDescribedBy: CONFIRM_CLEAR_STORAGE_MESSAGE_ID,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          const index = this.singles().indexOf(fav as EditableFavorite);
          this.favoriteSrvc.removeFavorite(fav.id);
          this.setFavorites();
          this.focusAfterDelete(index);
        }
      });
  }

  setFavLabel(fav: Favorite, label: string) {
    this.favoriteSrvc.changeLabel(fav, label);
  }

  /**
   * The dialog hands focus back to the delete button it came from - which went
   * with the favorite. Move it to the next favorite's delete button instead, or
   * to the close button once the list is empty (WCAG 2.4.3).
   */
  private focusAfterDelete(index: number) {
    afterNextRender(
      () => {
        const deleteButtons =
          this.host.nativeElement.querySelectorAll<HTMLElement>(
            '.fav-actions .delete-favorite',
          );
        const target =
          deleteButtons[Math.min(index, deleteButtons.length - 1)] ??
          this.host.nativeElement.querySelector<HTMLElement>(
            '[mat-dialog-close]',
          );
        target?.focus();
      },
      { injector: this.injector },
    );
  }

  private setFavorites() {
    this.singles.set(
      this.favoriteSrvc
        .getFavorites()
        .map((e) => this.createEditableFavorite(e)),
    );
  }

  private createEditableFavorite(fav: Favorite) {
    const ef = fav as EditableFavorite;
    ef.editMode = false;
    return ef;
  }
}
