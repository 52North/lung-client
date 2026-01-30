import { Component, inject, input, Pipe, PipeTransform } from '@angular/core';
import {
  MatListModule,
  MatListOption,
  MatSelectionList,
  MatSelectionListChange,
} from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InternalIdHandler, TzDatePipe } from '@helgoland/core';
import { LabelMapperComponent } from '@helgoland/depiction';
import { SelectableDataset } from '@helgoland/selector';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationService } from '../../../services/configuration.service';
import { TimeseriesService } from '../../../services/timeseries-service.service';

@Pipe({ name: 'sort' })
export class SortPipe implements PipeTransform {
  constructor() {}

  transform(datasets: SelectableDataset[]): SelectableDataset[] {
    return datasets.sort((a, b) => {
      const labelA = a.label || '';
      const labelB = b.label || '';
      return labelA.localeCompare(labelB);
    });
  }
}

@Component({
  selector: 'app-dataset-list',
  templateUrl: './dataset-list.component.html',
  styleUrls: ['./dataset-list.component.scss'],
  imports: [
    SortPipe,
    LabelMapperComponent,
    TranslateModule,
    TzDatePipe,
    MatSelectionList,
    MatListOption,
    MatListModule,
    MatTooltipModule,
  ],
})
export class DatasetListComponent {
  private idHandler = inject(InternalIdHandler);
  private configSrvc = inject(ConfigurationService);
  private timeseries = inject(TimeseriesService);
  private staUrl = this.configSrvc.configuration.defaultService.apiUrl;

  readonly datasets = input.required<SelectableDataset[]>();

  adjustSelection(change: MatSelectionListChange) {
    const id = (change.options[0].value as SelectableDataset).id;
    const internalId = this.idHandler.createInternalId(this.staUrl, id);
    if (change.options[0].selected) {
      this.timeseries.addDataset(internalId);
    } else {
      this.timeseries.removeDataset(internalId);
    }
  }
}
