import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'helgoland-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  imports: [MatIconModule, MatButtonModule, TranslateModule],
})
export class NotificationComponent {
  protected data = inject(MAT_SNACK_BAR_DATA);

  protected dismiss(id: number) {
    this.data.dismiss(id);
  }
}
