import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ClearStorageButtonComponent } from '../../clear-storage-button/clear-storage-button.component';
import { LanguageSelectorComponent } from '../../language-selector/language-selector.component';
import { VersionInfoComponent } from '../../version-info/version-info.component';
import { ConfigurationService } from './../../../services/configuration.service';

@Component({
  selector: 'helgoland-modal-main-config',
  templateUrl: './modal-main-config.component.html',
  styleUrls: ['./modal-main-config.component.scss'],
  imports: [
    ClearStorageButtonComponent,
    LanguageSelectorComponent,
    MatButtonModule,
    MatDialogModule,
    TranslateModule,
    VersionInfoComponent,
  ],
})
export class ModalMainConfigComponent {
  private config = inject(ConfigurationService);

  languages = this.config.configuration?.languages;
}
