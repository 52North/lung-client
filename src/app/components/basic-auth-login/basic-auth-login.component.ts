import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'helgoland-basic-auth-login',
  templateUrl: './basic-auth-login.component.html',
  styleUrls: ['./basic-auth-login.component.scss'],
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
  ],
})
export class BasicAuthLoginComponent {
  protected dialogRef =
    inject<MatDialogRef<BasicAuthLoginComponent>>(MatDialogRef);
  protected url = inject(MAT_DIALOG_DATA);

  username: string | undefined;
  password: string | undefined;

  confirm() {
    this.dialogRef.close({
      username: this.username,
      password: this.password,
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
