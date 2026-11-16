import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Timespan } from '@helgoland/core';
import { SeriesGraphDataset } from '@helgoland/d3';
import { TranslateModule } from '@ngx-translate/core';
import { utils, WorkBook, WorkSheet, writeFile } from 'xlsx';
import { cellValue, columnsForRows } from '../../helper/table-columns';
import { createDataTable } from '../../helper/table-creation';
type xlsxExport = any[][];

enum DownloadType {
  CSV = 'csv',
  XLSX = 'xlsx',
}

@Component({
  selector: 'helgoland-download-data',
  templateUrl: './download-data.component.html',
  imports: [
    TranslateModule,
    MatTooltipModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
  ],
  styleUrls: ['./download-data.component.scss'],
})
export class DownloadDataComponent {
  readonly datasets = input.required<SeriesGraphDataset[]>();

  readonly timespan = input<Timespan>();

  private fileName = 'timeseries';

  constructor() {}

  exportXSLX() {
    this.prepareData(DownloadType.XLSX);
  }

  exportCSV() {
    this.prepareData(DownloadType.CSV);
  }

  private prepareData(dwType: DownloadType): void {
    console.log('Preparing data ...');
    const timespan = this.timespan();
    if (timespan === undefined) return;

    const rows = createDataTable(this.datasets(), timespan);
    rows.sort((a, b) => a.datum_uhrzeit - b.datum_uhrzeit);

    const columns = columnsForRows(rows, { includeHidden: true });
    const mapped = rows.map((row) =>
      Object.fromEntries(columns.map((c) => [c.title, cellValue(row, c.key)])),
    );

    this.downloadData(mapped, dwType);
  }

  private downloadData(data: any, dwType: DownloadType): void {
    console.log('Downloading data ...');
    /* generate worksheet */
    const ws: WorkSheet = utils.json_to_sheet(data);
    /* generate workbook and add the worksheet */
    const wb: WorkBook = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    /* save to file depending on download type */
    writeFile(wb, `${this.fileName}.${dwType}`);
  }
}
