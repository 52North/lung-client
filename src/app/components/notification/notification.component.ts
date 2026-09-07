import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';

@Component({
  selector: 'helgoland-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  imports: [MatIconModule, MatButtonModule],
})
export class NotificationComponent {
  protected snackBarRef =
    inject<MatSnackBarRef<NotificationComponent>>(MatSnackBarRef);
  protected data = inject(MAT_SNACK_BAR_DATA);

  removeMessage(message: string) {
    this.data.messages.update((msgs: string[]) => {
      return msgs.toSpliced(msgs.indexOf(message), 1);
    });

    if (this.data.messages().length === 0) {
      this.snackBarRef.dismiss();
    }
  }
}
