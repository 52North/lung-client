import { Clipboard } from '@angular/cdk/clipboard';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NotifierService } from '../../services/notifier.service';

@Component({
  selector: 'helgoland-share-button',
  templateUrl: './share-button.component.html',
  styleUrls: ['./share-button.component.scss'],
  // Lets the labelled variant fill its column without the parent having to
  // reach through view encapsulation.
  host: { '[class.has-label]': '!!label()' },
  imports: [MatIconModule, TranslateModule, MatTooltipModule, MatButtonModule],
})
export class ShareButtonComponent {
  private clipboard = inject(Clipboard);
  private notifier = inject(NotifierService);
  private translate = inject(TranslateService);

  readonly generatedUrlFunction = input<() => string>();

  /** i18n key of a visible label. Without it the button stays icon-only. */
  readonly label = input<string>();

  shareState() {
    const generatedUrlFunction = this.generatedUrlFunction();
    if (generatedUrlFunction) {
      const url = generatedUrlFunction();
      if (this.clipboard.copy(url)) {
        // a confirmation: pasting shows whether it worked
        this.notifier.notify(
          this.translate.instant('permalink.copy-to-clipboard'),
        );
      } else {
        // the only place that tells the link never reached the clipboard
        this.notifier.notify(
          this.translate.instant('permalink.copy-to-clipboard-error'),
          { kind: 'important' },
        );
      }
    } else {
      throw new Error('generateUrlFunction is not defined');
    }
  }
}
