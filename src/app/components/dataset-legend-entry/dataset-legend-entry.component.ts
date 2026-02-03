import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  HelgolandCoreModule,
  Time,
  TimeInterval,
  Timespan,
} from '@helgoland/core';
import {
  AreaDatasetChild,
  SeriesGraphDataset,
  TimeseriesChild,
} from '@helgoland/d3';
import { HelgolandLabelMapperModule } from '@helgoland/depiction';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DatasetMetadataComponent } from '../dataset-metadata/dataset-metadata.component';
import { FavoriteToggleButtonComponent } from '../favorites/favorite-toggle-button/favorite-toggle-button.component';
import { LoadingOverlayProgressBarComponent } from '../loading-overlay-progress-bar/loading-overlay-progress-bar.component';
import { ModalEditTimeseriesOptionsComponent } from '../modal-edit-timeseries-options/modal-edit-timeseries-options.component';
import { TimeseriesEntrySymbolComponent } from '../timeseries-entry-symbol/timeseries-entry-symbol.component';

@Component({
  selector: 'helgoland-dataset-legend-entry',
  templateUrl: './dataset-legend-entry.component.html',
  styleUrls: ['./dataset-legend-entry.component.scss'],
  imports: [
    CommonModule,
    FavoriteToggleButtonComponent,
    HelgolandLabelMapperModule,
    HelgolandCoreModule,
    LoadingOverlayProgressBarComponent,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    TimeseriesEntrySymbolComponent,
    TranslateModule,
    DatasetMetadataComponent,
  ],
})
export class DatasetLegendEntryComponent {
  protected translateSrvc = inject(TranslateService);
  protected timeSrvc = inject(Time);
  private dialog = inject(MatDialog);

  // Remove later:
  error = false;
  // loading = false;
  //

  readonly dataset = input.required<SeriesGraphDataset>();

  readonly selected = input.required<boolean>();

  readonly timeInterval = input.required<TimeInterval | undefined>();

  readonly datasetDeleted = output<void>();

  readonly selectDate = output<Date>();

  readonly selectTimespan = output<Timespan>();

  hasData = true;

  constructor() {
    effect(() => this.checkDataInTimespan());
  }

  get subheader() {
    const addtional = this.dataset().description.additional;
    if (addtional) {
      const gewaessername = addtional?.['gew_name'];
      const wb_cd = addtional?.['wb_cd'];
      const mst_nr = addtional?.['mst_nr'];
      return `${gewaessername} - ${wb_cd} - ${mst_nr}`;
    } else {
      return this.dataset().description.platformLabel;
    }
  }

  get additionalInfoLabel() {
    const additional = this.dataset().description.additional;
    if (additional) {
      let label = `Matrix: ${additional?.['matrix']}`;
      if (additional?.['methode']) {
        label += ` - Methode: ${additional?.['methode']}`;
      }
      if (additional?.['tiefe']) {
        label += ` | Tiefenstufe: ${additional?.['tiefe']}`;
      }
      return label;
    }
    return undefined;
  }

  removeDataset() {
    this.datasetDeleted.emit();
  }

  toggleSelection() {
    this.dataset().setSelected(!this.dataset().selected);
  }

  toggleVisibility() {
    this.dataset().setVisible(!this.dataset().visible);
  }

  editDatasetOptions() {
    const dialogRef = this.dialog.open(ModalEditTimeseriesOptionsComponent, {
      data: {
        dataset: this.dataset(),
      },
    });
  }

  toggleSeparateYAxis() {
    const yAxis = this.dataset().yAxis;
    yAxis.separate = !yAxis.separate;
    this.dataset().setYAxis(yAxis);
  }

  jumpToFirstTimeStamp() {
    const dataset = this.dataset();
    if (dataset.description.firstValue) {
      this.selectDate.emit(new Date(dataset.description.firstValue.timestamp));
    }
  }

  jumpToLastTimeStamp() {
    const dataset = this.dataset();
    if (dataset.description.lastValue) {
      this.selectDate.emit(new Date(dataset.description.lastValue.timestamp));
    }
  }

  showCompleteTimespan() {
    const dataset = this.dataset();
    if (dataset.description.firstValue && dataset.description.lastValue) {
      this.selectTimespan.emit(
        new Timespan(
          dataset.description.firstValue.timestamp,
          dataset.description.lastValue.timestamp,
        ),
      );
    }
  }

  getTimeseriesDatasetChildren() {
    return this.dataset().children.filter((e) => e instanceof TimeseriesChild);
  }

  getAreaDatasetChildren() {
    return this.dataset().children.filter((e) => e instanceof AreaDatasetChild);
  }

  private checkDataInTimespan() {
    const dataset = this.dataset();
    const timeInterval = this.timeInterval();
    if (
      timeInterval &&
      dataset.description &&
      dataset.description.firstValue &&
      dataset.description.lastValue
    ) {
      this.hasData = this.timeSrvc.overlaps(
        timeInterval,
        dataset.description.firstValue.timestamp,
        dataset.description.lastValue.timestamp,
      );
    }
  }
}
