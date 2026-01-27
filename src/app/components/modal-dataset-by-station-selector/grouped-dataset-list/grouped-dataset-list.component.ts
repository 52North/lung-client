import {
  Component,
  computed,
  inject,
  input,
  Pipe,
  PipeTransform,
  signal,
} from '@angular/core';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import {
  MatListModule,
  MatListOption,
  MatSelectionList,
  MatSelectionListChange,
} from '@angular/material/list';
import { InternalIdHandler, TzDatePipe } from '@helgoland/core';
import { LabelMapperComponent } from '@helgoland/depiction';
import { SelectableDataset } from '@helgoland/selector';
import { ConfigurationService } from '../../../services/configuration.service';
import { TimeseriesService } from '../../../services/timeseries-service.service';
import { StringFilterComponent } from '../../string-filter/string-filter.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Entry {
  title: string;
  id: string;
  datasets: SelectableDataset[];
}

@Pipe({ name: 'sort' })
export class SortPipe implements PipeTransform {
  constructor() { }

  transform(datasets: SelectableDataset[]): SelectableDataset[] {
    return datasets.sort((a, b) => {
      const labelA = a.label || '';
      const labelB = b.label || '';
      return labelA.localeCompare(labelB);
    });
  }
}

@Component({
  selector: 'app-grouped-dataset-list',
  templateUrl: './grouped-dataset-list.component.html',
  styleUrls: ['./grouped-dataset-list.component.scss'],
  imports: [
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelContent,
    SortPipe,
    MatAccordion,
    LabelMapperComponent,
    TranslateModule,
    TzDatePipe,
    MatSelectionList,
    MatListOption,
    MatListModule,
    MatTooltipModule,
    StringFilterComponent,
  ],
})
export class GroupedDatasetListComponent {
  private idHandler = inject(InternalIdHandler);
  private configSrvc = inject(ConfigurationService);
  private timeseries = inject(TimeseriesService);
  private staUrl = this.configSrvc.configuration.defaultService.apiUrl;

  readonly datasets = input.required<SelectableDataset[]>();

  private filter = signal<string>('');

  readonly groupedDatasets = computed<Entry[]>(() => {
    const result: Entry[] = [];
    const filteredDatasets = this.datasets().filter((ds) => {
      return ds.parameters.phenomenon?.label
        .toLowerCase()
        .includes(this.filter().toLowerCase());
    })
    if (filteredDatasets.length > 0) {
      result.push({
        id: "all",
        title: "Alle Phänomene",
        datasets: filteredDatasets,
      });
    }

    for (const ds of filteredDatasets) {
      const phenomenonId = ds.parameters.phenomenon?.id;
      const phenomenonTitle = ds.parameters.phenomenon?.label;
      const phenomenonGroups = ds.additional?.["phenomenon_group"];
      if (phenomenonId && phenomenonTitle) {

        for (const group of phenomenonGroups || []) {
          const match = result.find((e) => e.id === group);
          if (!match) {
            result.push({
              id: group,
              title: group,
              datasets: [ds],
            });
          } else {
            match.datasets.push(ds);
          }
        }
      }
    }
    return result.sort((a, b) => a.title.toLowerCase() < b.title.toLowerCase()? -1 : 1);
  });

  setFilter(filter: string) {
    this.filter.set(filter);
  }

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
