import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

/**
 * The id of the paragraph naming the consequence. The opening component points
 * the dialog's `aria-describedby` at it, so the sentence is announced when the
 * dialog opens - the name alone would only say what is asked, not what is lost.
 */
export const CONFIRM_CLEAR_STORAGE_MESSAGE_ID = 'clear-storage-confirm-message';

/** Lets the opening component refuse to stack a second copy of this dialog. */
export const CONFIRM_CLEAR_STORAGE_DIALOG_ID = 'clear-storage-confirm';

/**
 * i18n keys of the question, the consequence and the confirming button, plus the
 * parameters the consequence needs. Without data the dialog asks about the reset.
 */
export interface ConfirmDeletionTexts {
  title: string;
  message: string;
  confirm: string;
  params?: Record<string, string>;
}

const CLEAR_STORAGE_TEXTS: ConfirmDeletionTexts = {
  title: 'main-config.clear-storage.confirm.title',
  message: 'main-config.clear-storage.confirm.message',
  confirm: 'main-config.clear-storage.confirm.confirm',
};

/** Asks before something is deleted that cannot be restored (WCAG 3.3.4). */
@Component({
  selector: 'helgoland-modal-confirm-clear-storage',
  templateUrl: './modal-confirm-clear-storage.component.html',
  styleUrls: ['./modal-confirm-clear-storage.component.scss'],
  imports: [MatButtonModule, MatDialogModule, TranslateModule],
})
export class ModalConfirmClearStorageComponent {
  protected texts =
    inject<ConfirmDeletionTexts | null>(MAT_DIALOG_DATA, { optional: true }) ??
    CLEAR_STORAGE_TEXTS;
}
