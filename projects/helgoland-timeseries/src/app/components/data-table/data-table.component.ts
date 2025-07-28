import {
  ChangeDetectionStrategy,
  Component,
  DoCheck,
  inject,
  input,
  IterableDiffer,
  IterableDiffers,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { HelgolandCoreModule, Timespan } from '@helgoland/core';
import { SeriesGraphDataset } from '@helgoland/d3';
import { Subscription } from 'rxjs';
import { buildDataTable, DataTableRow } from '../../helper/table-creation';

interface DatasetEventSubscriptions {
  state: Subscription;
  data: Subscription;
}

@Component({
  selector: 'helgoland-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  imports: [MatTableModule, HelgolandCoreModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements DoCheck {
  protected iterableDiffers = inject(IterableDiffers);

  readonly datasets = input<SeriesGraphDataset[]>([]);
  private datasetsDiffer: IterableDiffer<SeriesGraphDataset>;

  readonly timespan = input<Timespan>();

  private subscriptions: Map<string, DatasetEventSubscriptions> = new Map();

  displayedColumns: string[] = [];
  dataSource: DataTableRow[] = [];

  constructor() {
    this.datasetsDiffer = this.iterableDiffers.find([]).create();

    // effect(() => {
    //   // We just have to use the source signals
    //   // somewhere inside this effect
    //   const currentCount = this.datasets();
    //   // const derivedCounter = this.derivedCounter();
    //   console.log(`current datasets: ${currentCount}`);
    // });
  }

  ngDoCheck(): void {
    const graphDatasetsChanges = this.datasetsDiffer.diff(this.datasets());
    if (graphDatasetsChanges && this.datasets()) {
      graphDatasetsChanges.forEachAddedItem((addedItem) => {
        if (addedItem.item instanceof SeriesGraphDataset) {
          if (addedItem.item.hasData()) {
            this.calcData();
          }
          this.subscribeEvents(addedItem.item);
        }
      });
      graphDatasetsChanges.forEachRemovedItem((removedItem) => {
        this.calcData();
        if (removedItem.item instanceof SeriesGraphDataset) {
          this.unsubscribeEvents(removedItem.item);
        }
      });
    }
  }

  private calcData() {
    const timespan = this.timespan();
    if (timespan === undefined) return;
    this.displayedColumns = [
      'timestamp',
      ...this.datasets().map((ds) => ds.id),
    ];
    this.dataSource = buildDataTable(this.datasets(), timespan);
  }

  private subscribeEvents(ds: SeriesGraphDataset) {
    let dataSubscription: Subscription;
    dataSubscription = ds.dataChangeEvent.subscribe(() => {
      this.calcData();
    });
    const events: DatasetEventSubscriptions = {
      state: ds.stateChangeEvent.subscribe(() => this.calcData()),
      data: dataSubscription,
    };
    this.subscriptions.set(ds.id, events);
  }

  private unsubscribeEvents(item: SeriesGraphDataset) {
    if (this.subscriptions.has(item.id)) {
      this.subscriptions.get(item.id)!.state.unsubscribe();
      this.subscriptions.get(item.id)!.data.unsubscribe();
      this.subscriptions.delete(item.id);
    }
  }
}
