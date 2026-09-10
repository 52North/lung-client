import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BasicAuthInformer, BasicAuthService } from '@helgoland/auth';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Observer } from 'rxjs';

import { BasicAuthLoginComponent } from '../components/basic-auth-login/basic-auth-login.component';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root',
})
export class BasicAuthInformerImplService implements BasicAuthInformer {
  private basicAuthSrvc = inject(BasicAuthService);
  private dialog = inject(MatDialog);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);

  doBasicAuth(url: string): Observable<boolean> {
    return new Observable<boolean>((observer: Observer<boolean>) => {
      const dialogRef = this.dialog.open(BasicAuthLoginComponent, {
        width: '400px',
        data: url,
        disableClose: true,
      });

      dialogRef.afterClosed().subscribe((res) => {
        if (res && res.username && res.password) {
          this.basicAuthSrvc.auth(res.username, res.password, url).subscribe({
            next: (token) => {
              observer.next(true);
              observer.complete();
            },
            error: (error: unknown) => {
              const wrongCredentials =
                error instanceof HttpErrorResponse && error.status === 401;
              this.errorHandler.error(
                this.translate.instant(
                  wrongCredentials
                    ? 'authentication.failed'
                    : 'authentication.error',
                ),
                wrongCredentials ? undefined : error,
              );
              observer.next(false);
              observer.complete();
            },
          });
        } else {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }
}
