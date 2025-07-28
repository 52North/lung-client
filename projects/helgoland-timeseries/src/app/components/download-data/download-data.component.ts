import { Component, input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Timespan } from '@helgoland/core';
import { SeriesGraphDataset } from '@helgoland/d3';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';
import { utils, WorkBook, WorkSheet, writeFile } from 'xlsx';
import { buildDataTable } from '../../helper/table-creation';
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
export class DownloadDataComponent implements OnInit {
  readonly datasets = input.required<SeriesGraphDataset[]>();

  readonly timespan = input<Timespan>();

  private fileName = 'timeseries';

  constructor() {}

  ngOnInit() {}

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
    let exportData: xlsxExport = [
      [
        'Phenomenon',
        ...this.datasets().map((ds) => ds.description.phenomenonLabel),
      ],
      ['Station', ...this.datasets().map((ds) => ds.description.platformLabel)],
    ];

    const dataTable = buildDataTable(this.datasets(), timespan);
    exportData = exportData.concat(
      dataTable.map((row) => {
        row[0] = moment(row[0]).format() as any;
        return row;
      }),
    );

    this.downloadData(exportData, dwType);
  }

  private downloadData(data: xlsxExport, dwType: DownloadType): void {
    console.log('Downloading data ...');
    /* generate worksheet */
    const ws: WorkSheet = utils.aoa_to_sheet(data);
    /* generate workbook and add the worksheet */
    const wb: WorkBook = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    /* save to file depending on download type */
    this.fileName += '.' + dwType;
    writeFile(wb, this.fileName);
  }
}
