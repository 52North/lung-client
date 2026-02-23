import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DoCheck,
  EventEmitter,
  inject,
  input,
  IterableDiffer,
  IterableDiffers,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator'; 
import {
  HelgolandCoreModule,
  Timespan,
  TimezoneService,
} from '@helgoland/core';
import { SeriesGraphDataset } from '@helgoland/d3';
import { debounceTime, from, Subscription } from 'rxjs';
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
  imports: [MatTableModule, HelgolandCoreModule, MatSortModule, MatPaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements DoCheck {
  protected iterableDiffers = inject(IterableDiffers);
  private timezoneSrvc = inject(TimezoneService);

  readonly datasets = input<SeriesGraphDataset[]>([]);
  private datasetsDiffer: IterableDiffer<SeriesGraphDataset>;
  readonly timespan = input<Timespan>();

  private subscriptions: Map<string, DatasetEventSubscriptions> = new Map();
  private redraw: EventEmitter<SeriesGraphDataset>;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

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
      title: 'datum',
      key: 'datum',
      visible: true,
      sort: true,
    },
    {
      title: 'uhrzeit',
      key: 'uhrzeit',
      visible: true,
      sort: true,
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

  dataSource: WritableSignal<MatTableDataSource<TableRow> | undefined> = signal(undefined);

  protected get displayedColumns(): string[] {
    return this.visibleColumns.filter((e) => e.visible).map((e) => e.key);
  }

  constructor() {
    this.datasetsDiffer = this.iterableDiffers.find([]).create();

    this.redraw = new EventEmitter();
    from(this.redraw)
      .pipe(debounceTime(20))
      .subscribe((obs) => {
        this.calcData();
      });
  }

  ngDoCheck(): void {
    const graphDatasetsChanges = this.datasetsDiffer.diff(this.datasets());
    if (graphDatasetsChanges && this.datasets()) {
      graphDatasetsChanges.forEachAddedItem((addedItem) => {
        if (addedItem.item instanceof SeriesGraphDataset) {
          if (addedItem.item.hasData()) {
            this.redraw.emit();
          }
          this.subscribeEvents(addedItem.item);
        }
      });
      graphDatasetsChanges.forEachRemovedItem((removedItem) => {
        this.redraw.emit();
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
    const datasource = new MatTableDataSource<TableRow>();
    datasource.sort = this.sort
    datasource.paginator = this.paginator;
    datasource.data = createDataTable(this.datasets(), timespan);
    this.dataSource.set(datasource);
  }

  private subscribeEvents(ds: SeriesGraphDataset) {
    let dataSubscription: Subscription;
    dataSubscription = ds.dataChangeEvent.subscribe(() => {
      this.redraw.emit();
    });
    const events: DatasetEventSubscriptions = {
      state: ds.stateChangeEvent.subscribe(() => this.redraw.emit),
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
