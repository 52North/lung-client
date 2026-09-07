import { Component, inject, input, resource } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HelgolandCoreModule } from '@helgoland/core';
import { TranslateModule } from '@ngx-translate/core';
import { MetaverService } from 'src/app/services/metaver.service';

@Component({
  selector: 'app-modal-metadata-preview',
  templateUrl: './modal-metadata-preview.component.html',
  imports: [
    TranslateModule,
    MatDialogModule,
    MatProgressBarModule,
    MatButtonModule,
    HelgolandCoreModule,
    MatIconModule,
  ],
  styleUrls: ['./modal-metadata-preview.component.scss'],
})
export class ModalMetadataPreviewComponent {
  private metaverService = inject(MetaverService);

  readonly metadataId = input.required<string>();

  metadataResource = resource({
    params: () => this.metadataId(),
    loader: ({ params: id }) => this.metaverService.getMetadataResource(id),
  });

  openAdditionalInformation() {
    window.open(
      `https://metaver.de/trefferanzeige?docuuid=${this.metadataId()}`,
      '_blank',
    );
  }
}
