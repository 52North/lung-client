import { Timespan } from '@helgoland/core';
import { DatasetStyle, SeriesGraphDataset } from '@helgoland/d3';

export interface TableRow {
  gew_art: string;
  bundesland: string;
  mst_nr: string;
  ort: string;
  gewässername: string;
  wb_cd: string;
  wb_type_cd: string;
  datum: string;
  uhrzeit: string;
  matrix: string;
  methode: string;
  param_kurz: string;
  parameter: string;
  param_gruppen: string;
  vorzeichen: string;
  wert_berechnet: number;
  einheit: string;
  tiefe: string;
  tiefenstufe: string;
  datum_uhrzeit: number;
}

export function createDataTable(
  datasets: SeriesGraphDataset<DatasetStyle>[],
  timespan: Timespan,
) {
  let data: TableRow[] = [];
  datasets.forEach((ds) => {
    ds.data.forEach((d) => {
      const additional = ds.description.additional;
      const date = new Date(d.timestamp)
      if (d.timestamp > timespan.from && d.timestamp < timespan.to) {
        data.push({
          gew_art: additional?.['gew_art'] || '',
          bundesland: additional?.['location']['bundesland'] || '',
          mst_nr: additional?.['mst_nr'] || '',
          ort: additional?.['ort'] || '',
          gewässername: additional?.['gew_name'] || '',
          wb_cd: additional?.['wb_cd'] || '',
          wb_type_cd: additional?.['wb_type_cd'] || '',
          datum: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          uhrzeit: date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          matrix: additional?.['matrix'] || '',
          methode: d.parameter?.methode || '',
          param_kurz: ds.description.phenomenonLabel || '',
          parameter: additional?.['observedProperty']?.definition || '',
          param_gruppen: additional?.['phenomenon_group'].join('; ') || [],
          vorzeichen: d.parameter?.vorzeichen || '',
          wert_berechnet: d.value,
          einheit: ds.description.uom,
          tiefe: d.parameter?.['tiefe'] || '',
          tiefenstufe: d.parameter?.['tiefenstufe'] || '',
          datum_uhrzeit: d.timestamp
        });
      }
    });
  });
  return data;
}
