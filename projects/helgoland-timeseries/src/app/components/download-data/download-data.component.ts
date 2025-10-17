import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Timespan } from '@helgoland/core';
import { SeriesGraphDataset } from '@helgoland/d3';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';
import { utils, WorkBook, WorkSheet, writeFile } from 'xlsx';
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

    let data: any[] = [];

    this.datasets().forEach((ds) => {
      const entries = ds.data.map((d) => {
        const additional = ds.description.additional;
        return {
          gew_art: additional?.['gew_art'] || '',
          bundesland: '???',
          mst_nr: '???',
          ort: ds.description.platformLabel,
          gewässername: additional?.['gew_name'] || '',
          wb_cd: additional?.['wb_cd'] || '',
          wb_type_cd: additional?.['wb_type_cd'] || '',
          datum_uhrzeit: d.timestamp,
          matrix: additional?.['matrix']?.join(',') || '',
          methode: '???',
          param_kurz: ds.description.phenomenonLabel,
          parameter: additional?.['observedProperty']?.definition || '',
          vorzeichen: '???',
          wert_berechnet: d.value,
        };
      });
      data.push(...entries);
    });

    data.sort((a, b) => a.datum_uhrzeit - b.datum_uhrzeit);

    data.forEach((e) => (e.datum_uhrzeit = moment(e.datum_uhrzeit).format()));

    this.downloadData(data, dwType);
  }

  private downloadData(data: any, dwType: DownloadType): void {
    console.log('Downloading data ...');
    /* generate worksheet */
    const ws: WorkSheet = utils.json_to_sheet(data);
    /* generate workbook and add the worksheet */
    const wb: WorkBook = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    /* save to file depending on download type */
    this.fileName += '.' + dwType;
    writeFile(wb, this.fileName);
  }
}
