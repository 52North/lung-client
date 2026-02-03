import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DoCheck,
  inject,
  input,
  IterableDiffer,
  IterableDiffers,
  ViewChild,
} from '@angular/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  HelgolandCoreModule,
  Timespan,
  TimezoneService,
} from '@helgoland/core';
import { SeriesGraphDataset } from '@helgoland/d3';
import { Subscription } from 'rxjs';
import { createDataTable, TableRow } from '../../helper/table-creation';
interface DatasetEventSubscriptions {
  state: Subscription;
  data: Subscription;
}

interface ColumnConfig {
  title: string;
  key: string;
  visible: boolean;
  sort?: boolean;
  formatter?: (val: string) => string;
}

@Component({
  selector: 'helgoland-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  imports: [MatTableModule, HelgolandCoreModule, MatSortModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements DoCheck, AfterViewInit {
  protected iterableDiffers = inject(IterableDiffers);
  private timezoneSrvc = inject(TimezoneService);

  readonly datasets = input<SeriesGraphDataset[]>([]);
  private datasetsDiffer: IterableDiffer<SeriesGraphDataset>;

  readonly timespan = input<Timespan>();

  private subscriptions: Map<string, DatasetEventSubscriptions> = new Map();

  @ViewChild(MatSort) sort: MatSort | undefined;

  visibleColumns: ColumnConfig[] = [
    {
      title: 'Gewässerart',
      key: 'gew_art',
      visible: true,
      sort: true,
    },
    {
      title: 'Bundesland',
      key: 'bundesland',
      visible: true,
      sort: true,
    },
    {
      title: 'mst_nr',
      key: 'mst_nr',
      visible: true,
      sort: true,
    },
    {
      title: 'Ort',
      key: 'ort',
      visible: true,
      sort: true,
    },
    {
      title: 'Gewässer',
      key: 'gewässername',
      visible: true,
      sort: true,
    },
    {
      title: 'wb_cd',
      key: 'wb_cd',
      visible: true,
      sort: true,
    },
    {
      title: 'wb_type_cd',
      key: 'wb_type_cd',
      visible: true,
      sort: true,
    },
    {
      title: 'datum_uhrzeit',
      key: 'datum_uhrzeit',
      visible: true,
      sort: true,
      formatter: (val) => this.timezoneSrvc.formatTzDate(val),
    },
    {
      title: 'matrix',
      key: 'matrix',
      visible: true,
      sort: true,
    },
    {
      title: 'methode',
      key: 'methode',
      visible: true,
      sort: true,
    },
    {
      title: 'param_kurz',
      key: 'param_kurz',
      visible: true,
      sort: true,
    },
    {
      title: 'parameter',
      key: 'parameter',
      visible: true,
      sort: true,
    },
    {
      title: 'par_gruppen',
      key: 'param_gruppen',
      visible: true,
      sort: true,
    },
    {
      title: 'vorzeichen',
      key: 'vorzeichen',
      visible: true,
      sort: true,
    },
    {
      title: 'wert_berechnet',
      key: 'wert_berechnet',
      sort: true,
      visible: true,
    },
    {
      title: 'einheit',
      key: 'einheit',
      sort: true,
      visible: true,
    },
    {
      title: 'tiefe',
      key: 'tiefe',
      sort: true,
      visible: true,
    },
    {
      title: 'tiefenstufe',
      key: 'tiefenstufe',
      sort: true,
      visible: true,
    },
  ];

  dataSource: MatTableDataSource<TableRow> | undefined;

  protected get displayedColumns(): string[] {
    return this.visibleColumns.filter((e) => e.visible).map((e) => e.key);
  }

  constructor() {
    this.datasetsDiffer = this.iterableDiffers.find([]).create();
  }

  ngAfterViewInit(): void {
    this.finalizeTableInit();
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

  protected renderValue(val: string, colConf: ColumnConfig) {
    if (colConf.formatter) {
      return colConf.formatter(val);
    } else {
      return val;
    }
  }

  private calcData() {
    const timespan = this.timespan();
    if (timespan === undefined) return;
    this.dataSource = new MatTableDataSource(
      createDataTable(this.datasets(), timespan),
    );
    this.finalizeTableInit();
  }

  private finalizeTableInit() {
    if (this.dataSource && this.sort) {
      this.dataSource.sort = this.sort;
    }
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
