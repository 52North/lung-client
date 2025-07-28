import { Timespan } from '@helgoland/core';
import { DatasetStyle, SeriesGraphDataset } from '@helgoland/d3';

export type DataTableRow = (number | null)[];

export function buildDataTable<T extends DatasetStyle>(
  datasets: SeriesGraphDataset<T>[],
  timespan: Timespan,
): DataTableRow[] {
  const series = datasets.map((ds) =>
    ds.data.map((d) => ({
      t: d.timestamp,
      v: d.value,
    })),
  );

  let timestamps = Array.from(
    new Set(series.flatMap((s) => s.map((p) => p.t))),
  ).sort((a, b) => a - b);
  const start = timestamps.findIndex((t) => t >= timespan.from);
  const end = timestamps.findLastIndex((t) => t <= timespan.to);
  timestamps = timestamps.slice(start, end + 1);

  const maps = series.map(
    (s) => new Map<number, number>(s.map((p) => [p.t, p.v])),
  );

  const rows: DataTableRow[] = timestamps.map((t) => {
    const values = maps.map((m) => m.get(t) ?? null); // null, falls Wert fehlt
    return [t, ...values];
  });

  return rows;
}
