import { Component, HostBinding, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'helgoland-loading-overlay-progress-bar',
  templateUrl: './loading-overlay-progress-bar.component.html',
  styleUrls: ['./loading-overlay-progress-bar.component.scss'],
  imports: [MatProgressBarModule, TranslateModule],
})
export class LoadingOverlayProgressBarComponent {
  readonly progressBarPosition = input<'top' | 'bottom'>();

  @HostBinding('style.align-items') get alignItems() {
    switch (this.progressBarPosition()) {
      case 'top':
        return 'flex-start';
      default:
        return 'flex-end';
    }
  }
}
