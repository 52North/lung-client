import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, HostBinding, inject, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'helgoland-loading-overlay-progress-bar',
  templateUrl: './loading-overlay-progress-bar.component.html',
  styleUrls: ['./loading-overlay-progress-bar.component.scss'],
  imports: [MatProgressBarModule, TranslateModule],
})
export class LoadingOverlayProgressBarComponent {
  private liveAnnouncer = inject(LiveAnnouncer);
  private translate = inject(TranslateService);

  readonly progressBarPosition = input<'top' | 'bottom'>();

  constructor() {
    // the progress bar only appears while loading; its label alone is never
    // read out, so the start of the load is announced explicitly (WCAG 4.1.3)
    this.liveAnnouncer.announce(
      this.translate.instant('controls.loading'),
      'polite',
    );
  }

  @HostBinding('style.align-items') get alignItems() {
    switch (this.progressBarPosition()) {
      case 'top':
        return 'flex-start';
      default:
        return 'flex-end';
    }
  }
}
