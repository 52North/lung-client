import {
  AfterViewChecked,
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
  WritableSignal
} from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  HelgolandCoreModule,
  Timespan
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
  imports: [
    MatTableModule,
    HelgolandCoreModule,
    MatSortModule,
    MatPaginatorModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements DoCheck, AfterViewChecked {
  protected iterableDiffers = inject(IterableDiffers);

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
      title: 'Messstelle',
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
      title: 'Gewässername',
      key: 'gewässername',
      visible: true,
      sort: true,
    },
    {
      title: 'Wasserkörper-Code',
      key: 'wb_cd',
      visible: true,
      sort: true,
    },
    {
      title: 'Wasserkörper-Typ',
      key: 'wb_type_cd',
      visible: true,
      sort: true,
    },
    {
      title: 'Datum',
      key: 'datum',
      visible: true,
      sort: true,
    },
    {
      title: 'Uhrzeit',
      key: 'uhrzeit',
      visible: true,
      sort: true,
    },
    {
      title: 'Matrix',
      key: 'matrix',
      visible: true,
      sort: true,
    },
    {
      title: 'Methode',
      key: 'methode',
      visible: true,
      sort: true,
    },
    {
      title: 'Parameter-Kurz',
      key: 'param_kurz',
      visible: true,
      sort: true,
    },
    {
      title: 'Parameter',
      key: 'parameter',
      visible: true,
      sort: true,
    },
    {
      title: 'Parameter-Gruppe',
      key: 'param_gruppen',
      visible: true,
      sort: true,
    },
    {
      title: 'Vorzeichen',
      key: 'vorzeichen',
      visible: true,
      sort: true,
    },
    {
      title: 'Wert berechnet',
      key: 'wert_berechnet',
      sort: true,
      visible: true,
    },
    {
      title: 'Einheit',
      key: 'einheit',
      sort: true,
      visible: true,
    },
    {
      title: 'Tiefe',
      key: 'tiefe',
      sort: true,
      visible: true,
    },
    {
      title: 'Tiefenstufe',
      key: 'tiefenstufe',
      sort: true,
      visible: true,
    },
  ];

  dataSource: WritableSignal<MatTableDataSource<TableRow> | undefined> =
    signal(undefined);

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

  ngAfterViewChecked(): void {
    const ds = this.dataSource();
    if (ds && this.sort && ds.sort !== this.sort) {
      ds.sort = this.sort;
    }
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
    datasource.sort = this.sort;
    datasource.sortingDataAccessor = (item, header) => {
      switch (header) {
        case 'datum': return item.datum_uhrzeit;
        case 'uhrzeit': return item.datum_uhrzeit;
        default: return item[header as keyof TableRow];;
      }
    };
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
