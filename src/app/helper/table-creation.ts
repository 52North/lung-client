import { Timespan } from '@helgoland/core';
import { DatasetStyle, SeriesGraphDataset } from '@helgoland/d3';
import { CellValue, columnDefsForMatrix, TableRow } from './table-columns';

export type { TableRow } from './table-columns';

export function createDataTable(
  datasets: SeriesGraphDataset<DatasetStyle>[],
  timespan: Timespan,
): TableRow[] {
  const data: TableRow[] = [];
  datasets.forEach((ds) => {
    const matrix: string = ds.description.additional?.['matrix'] || '';
    const columns = columnDefsForMatrix(matrix);
    ds.data.forEach((d) => {
      if (d.timestamp >= timespan.from && d.timestamp <= timespan.to) {
        const date = new Date(d.timestamp);
        const values: Record<string, CellValue> = {};
        columns.forEach((col) => (values[col.key] = col.value(ds, d, date)));
        data.push({ matrix, datum_uhrzeit: d.timestamp, values });
      }
    });
  });
  return data;
}
