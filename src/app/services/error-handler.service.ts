import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { NotifierService } from './notifier.service';
@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  private notifier = inject(NotifierService);
  private translate = inject(TranslateService);

  error(message: string, cause?: unknown) {
    if (cause !== undefined) {
      console.error(message, cause);
    }
    this.notifier.notify(this.withDetail(message, cause), {
      kind: 'important',
    });
  }

  private withDetail(message: string, cause?: unknown): string {
    const text = message.trim() || this.translate.instant('errors.unexpected');
    if (cause instanceof HttpErrorResponse && cause.status) {
      return `${text} (${this.translate.instant('errors.http-status', {
        status: cause.status,
      })})`;
    }
    return text;
  }
}
