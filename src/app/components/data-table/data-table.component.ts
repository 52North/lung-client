import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { HelgolandCoreModule, Timespan } from '@helgoland/core';
import { SeriesGraphDataset } from '@helgoland/d3';
import { debounceTime, from, Subscription } from 'rxjs';
import {
  CellValue,
  cellValue,
  ColumnDef,
  columnsForRows,
  NOT_APPLICABLE,
  TableRow,
} from '../../helper/table-columns';
import { createDataTable } from '../../helper/table-creation';
interface DatasetEventSubscriptions {
  state: Subscription;
  data: Subscription;
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

  protected readonly columns = signal<ColumnDef[]>([]);

  protected readonly displayedColumns = computed(() =>
    this.columns().map((c) => c.key),
  );

  dataSource: WritableSignal<MatTableDataSource<TableRow> | undefined> =
    signal(undefined);

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

  protected renderValue(row: TableRow, colConf: ColumnDef): CellValue {
    const val = cellValue(row, colConf.key);
    if (colConf.formatter && val !== NOT_APPLICABLE) {
      return colConf.formatter(val);
    }
    return val;
  }

  private calcData() {
    const timespan = this.timespan();
    if (timespan === undefined) return;
    const rows = createDataTable(this.datasets(), timespan);
    const columns = columnsForRows(rows);
    const columnsByKey = new Map(columns.map((c) => [c.key, c]));
    const datasource = new MatTableDataSource<TableRow>();
    datasource.sort = this.sort;
    datasource.sortingDataAccessor = (item, header) => {
      const col = columnsByKey.get(header);
      if (col?.sortValue) {
        return col.sortValue(item);
      }
      return item.values[header] ?? '';
    };
    datasource.paginator = this.paginator;
    datasource.data = rows;
    this.columns.set(columns);
    this.dataSource.set(datasource);
  }

  private subscribeEvents(ds: SeriesGraphDataset) {
    let dataSubscription: Subscription;
    dataSubscription = ds.dataChangeEvent.subscribe(() => {
      this.redraw.emit();
    });
    const events: DatasetEventSubscriptions = {
      state: ds.stateChangeEvent.subscribe(() => this.redraw.emit()),
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
