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
    this.snapshot = snapshot;
    const appTitle = this.translate.instant('header.title');
    const viewTitleKey = this.buildTitle(snapshot);
    this.title.setTitle(
      viewTitleKey
        ? `${this.translate.instant(viewTitleKey)} – ${appTitle}`
        : appTitle,
    );
  }
}
