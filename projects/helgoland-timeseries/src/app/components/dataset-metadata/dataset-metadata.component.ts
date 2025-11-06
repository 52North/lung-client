import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { SeriesGraphDataset } from '@helgoland/d3';
import { ModalMetadataPreviewComponent } from './modal-metadata-preview/modal-metadata-preview.component';

const keyMapping: Record<string, string> = {
  gew_art: 'Gewässerart',
  gew_name: 'Gewässername',
  tiefe: 'Tiefe',
  kat1: 'Kategorie 1',
  kat2: 'Kategorie 2',
  matrix: 'Matrix',
};

@Component({
  selector: 'helgoland-dataset-metadata',
  templateUrl: './dataset-metadata.component.html',
  imports: [MatExpansionModule, MatButtonModule],
  styleUrls: ['./dataset-metadata.component.scss'],
})
export class DatasetMetadataComponent {
  private dialog = inject(MatDialog);

  readonly dataset = input.required<SeriesGraphDataset>();

  readonly panelOpenState = signal(false);

  metadata = computed(() => {
    const additional = this.dataset()?.description?.additional;
    if (additional) {
      return Object.entries(additional)
        .filter(([key]) => keyMapping.hasOwnProperty(key))
        .map(([key, value]) => {
          return {
            label: keyMapping[key],
            value: this.parseMetadataValue(value),
          };
        });
    }
    return [];
  });

  metaID = computed(() => {
    const metaID = this.dataset()?.description?.additional?.['meta_uuid'];
    if (metaID) {
      return metaID;
    }
  });

  private parseMetadataValue(value: string | string[] | any): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    } else if (typeof value === 'string') {
      return value;
    } else {
      return JSON.stringify(value);
    }
  }

  protected openModalMetadataPreview() {
    const dialogRef = this.dialog.open(ModalMetadataPreviewComponent);
    dialogRef.componentRef?.setInput('metadataId', this.metaID());
  }
}
