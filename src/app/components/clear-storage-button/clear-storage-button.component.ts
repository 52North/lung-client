import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorage } from '@helgoland/core';
import { TranslateModule } from '@ngx-translate/core';

import {
  CONFIRM_CLEAR_STORAGE_DIALOG_ID,
  CONFIRM_CLEAR_STORAGE_MESSAGE_ID,
  ModalConfirmClearStorageComponent,
} from './modal-confirm-clear-storage/modal-confirm-clear-storage.component';

@Component({
  selector: 'helgoland-clear-storage-button',
  templateUrl: './clear-storage-button.component.html',
  styleUrls: ['./clear-storage-button.component.scss'],
  imports: [TranslateModule, MatButtonModule],
})
export class ClearStorageButtonComponent {
  private localStorage = inject(LocalStorage);
  private dialog = inject(MatDialog);

  confirmAndClear() {
    if (this.dialog.getDialogById(CONFIRM_CLEAR_STORAGE_DIALOG_ID)) {
      return;
    }
    this.dialog
      .open(ModalConfirmClearStorageComponent, {
        id: CONFIRM_CLEAR_STORAGE_DIALOG_ID,
        width: '400px',
        ariaDescribedBy: CONFIRM_CLEAR_STORAGE_MESSAGE_ID,
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.localStorage.clearStorage();
          window.location.reload();
        }
      });
  }
}
