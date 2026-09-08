import { LiveAnnouncer } from '@angular/cdk/a11y';
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

/**
 * Builds the document title from the route (WCAG 2.4.2). The routes carry the
 * i18n key of their view, not the title itself.
 */
@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private title = inject(Title);
  private translate = inject(TranslateService);
  private liveAnnouncer = inject(LiveAnnouncer);

  private snapshot?: RouterStateSnapshot;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => {
      if (this.snapshot) {
        this.updateTitle(this.snapshot);
      }
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const isNewView = !!this.snapshot && this.snapshot.url !== snapshot.url;
    this.snapshot = snapshot;
    const appTitle = this.translate.instant('header.title');
    const viewTitleKey = this.buildTitle(snapshot);
    const viewTitle = viewTitleKey ? this.translate.instant(viewTitleKey) : '';
    this.title.setTitle(viewTitle ? `${viewTitle} – ${appTitle}` : appTitle);

    // in a single page application a screen reader does not notice that the
    // view changed - the new title has to be announced (WCAG 4.1.3)
    if (isNewView && viewTitle) {
      this.liveAnnouncer.announce(viewTitle, 'polite');
    }
  }
}
