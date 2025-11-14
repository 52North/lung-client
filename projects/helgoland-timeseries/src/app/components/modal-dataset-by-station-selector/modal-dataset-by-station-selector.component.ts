import { Component, inject, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  HelgolandCoreModule,
  InternalIdHandler,
  Parameter,
  StaInterfaceService,
  TzDatePipe,
} from '@helgoland/core';
import { HelgolandLabelMapperModule } from '@helgoland/depiction';
import {
  DatasetByStationSelectorComponent,
  SelectableDataset,
} from '@helgoland/selector';
import { TranslateModule } from '@ngx-translate/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppRouterService } from '../../services/app-router.service';
import { ConfigurationService } from '../../services/configuration.service';
import { DatasetsService } from '../../services/graph-datasets.service';
import { TimeseriesService } from './../../services/timeseries-service.service';
import { GroupedDatasetListComponent } from './grouped-dataset-list/grouped-dataset-list.component';

@Component({
  selector: 'helgoland-modal-dataset-by-station-selector',
  templateUrl: './modal-dataset-by-station-selector.component.html',
  styleUrls: ['./modal-dataset-by-station-selector.component.scss'],
  imports: [
    HelgolandCoreModule,
    HelgolandLabelMapperModule,
    MatBadgeModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatListModule,
    MatProgressBarModule,
    TranslateModule,
    GroupedDatasetListComponent,
  ],
})
export class ModalDatasetByStationSelectorComponent extends DatasetByStationSelectorComponent {
  protected appRouter = inject(AppRouterService);
  protected graphDatasetsSrvc = inject(DatasetsService);
  protected timeseries = inject(TimeseriesService);
  private staSrvc = inject(StaInterfaceService);
  private configSrvc = inject(ConfigurationService);
  private idHandler = inject(InternalIdHandler);
  private staUrl = this.configSrvc.configuration.defaultService.apiUrl;

  protected datasets = signal(<SelectableDataset[]>[]);
  protected otherDatasets = signal(<SelectableDataset[]>[]);

  override ngOnInit() {
    this.loadData(true);
  }

  protected loadData(withPhenomenonFilter: boolean) {
    if (this.othersList.length > 0) {
      // we have already fetched previously.
      return;
    }

    let phenomenonId = withPhenomenonFilter ? this.phenomenonId() : undefined;

    let dsFilter = '';
    if (phenomenonId) {
      dsFilter = `;$filter=ObservedProperty/id eq '${phenomenonId}'`;
    }
    this.counter = 1;
    this.staSrvc
      .getLocation(this.staUrl, this.station().id, {
        $select: 'id',
        $expand: `Things($select=id),Things/Datastreams($top=1000;$expand=ObservedProperty($select=id,description,name);$select=id,phenomenonTime,properties${dsFilter})`,
      })
      .subscribe((location) => {
        this.counter = location.Things?.length || 0;
        location.Things?.forEach((thing) => {
          this.phenomenonMatchedList = [];
          thing.Datastreams?.forEach((ds) => {
            let firstValue, lastValue;
            if (ds.phenomenonTime) {
              const split = ds.phenomenonTime?.split('/');
              firstValue = { timestamp: Date.parse(split[0]) };
              lastValue = { timestamp: Date.parse(split[1]) };
            }
            this.prepareResult(
              {
                id: ds['@iot.id'],
                firstValue: firstValue,
                lastValue: lastValue,
                label: ds.ObservedProperty?.name,
                parameters: {
                  phenomenon: {
                    id: ds.ObservedProperty?.['@iot.id'],
                    label: ds.ObservedProperty?.description,
                  },
                  procedure: {
                    label: ds.ObservedProperty?.name,
                  },
                  service: {
                    id: '1', // We use this for filtering ds matching the search or not.
                  },
                },
                additional: {
                  tiefe: ds.properties?.['tiefe'],
                },
              } as SelectableDataset,
              this.timeseries.hasDataset(
                this.idHandler.createInternalId(this.staUrl, ds['@iot.id']),
              ),
            );
          });
          this.counter--;
        });
        this.phenomenonMatchedList.sort(this.sorter);
        this.datasets.set(this.phenomenonMatchedList);
        if (!phenomenonId) {
          this.othersList.sort(this.sorter);
          this.otherDatasets.set(this.othersList);
        }
      });
  }

  protected filterDatasets(event: Event, list: SelectableDataset[]) {
    const val = (event.target as HTMLInputElement).value;
    const filterValue = val.toLowerCase().replace(/\s/g, '');
    list.forEach((item) => {
      const matches = (
        (item.id || '') +
        (item.parameters.phenomenon?.label || '') +
        (item.parameters.procedure?.label || '')
      )
        .toLowerCase()
        .replace(/\s/g, '')
        .includes(filterValue);
      item.parameters.service!.id = matches ? '1' : '0';
    });

    list.sort(this.sorter);
  }

  sorter(a: SelectableDataset, b: SelectableDataset) {
    if (a.parameters.service!.id != b.parameters.service!.id) {
      return a.parameters.service!.id < b.parameters.service!.id ? 1 : -1;
    } else {
      return a.label < b.label ? -1 : 1;
    }
  }

  protected override prepareResult(
    result: SelectableDataset,
    selection: boolean,
  ) {
    result.selected = selection;
    const phenomenonId = this.phenomenonId();
    if (phenomenonId) {
      if (result.parameters.phenomenon?.id === phenomenonId) {
        this.phenomenonMatchedList.push(result);
      } else {
        this.othersList.push(result);
      }
    } else {
      this.phenomenonMatchedList.push(result);
    }

    const selected = this.phenomenonMatchedList.filter(
      (entry) => entry.selected,
    );
    this.onSelectionChanged.emit(selected);
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

  getCategoryLabel(categories: Parameter[]) {
    return categories.map((e) => e.label).join(', ');
  }
}
