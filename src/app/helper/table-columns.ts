import { GraphDataEntry, SeriesGraphDataset } from '@helgoland/d3';
import moment from 'moment';

export type CellValue = string | number;

export interface TableRow {
  /** matrix type of the row, decides which columns apply */
  matrix: string;
  /** raw timestamp, used for sorting */
  datum_uhrzeit: number;
  /** values of all columns applicable to this row's matrix; missing key = not applicable */
  values: Record<string, CellValue>;
}

export interface ColumnDef {
  key: string;
  /** header used in the table and in the export */
  title: string;
  sort?: boolean;
  /** short values (units, numbers, dates): column shrinks to its content, values don't wrap */
  compact?: boolean;
  /** only part of the export, not shown in the table */
  tableHidden?: boolean;
  value: (ds: SeriesGraphDataset, d: GraphDataEntry, date: Date) => CellValue;
  sortValue?: (row: TableRow) => CellValue;
  formatter?: (val: CellValue) => string;
}

/** marker for cells whose column does not apply to the row's matrix */
export const NOT_APPLICABLE = '–';

const additional = (ds: SeriesGraphDataset) => ds.description.additional;

/**
 * All known columns. The order of this list defines the column order in the table and the export.
 */
export const COLUMNS: ColumnDef[] = [
  {
    key: 'gew_art',
    title: 'Gewässerart',
    sort: true,
    value: (ds) => additional(ds)?.['gew_art'] || '',
  },
  {
    key: 'bundesland',
    title: 'Bundesland',
    sort: true,
    value: (ds) => additional(ds)?.['location']?.['bundesland'] || '',
  },
  {
    key: 'mst_nr',
    title: 'Messstelle',
    sort: true,
    compact: true,
    value: (ds) => additional(ds)?.['mst_nr'] || '',
  },
  {
    key: 'ort',
    title: 'Ort',
    sort: true,
    value: (ds) => additional(ds)?.['ort'] || '',
  },
  {
    key: 'gewässername',
    title: 'Gewässername',
    sort: true,
    value: (ds) => additional(ds)?.['gew_name'] || '',
  },
  {
    key: 'wb_cd',
    title: 'Wasserkörper-Code',
    sort: true,
    compact: true,
    value: (ds) => additional(ds)?.['wb_cd'] || '',
  },
  {
    key: 'wb_type_cd',
    title: 'Wasserkörper-Typ',
    sort: true,
    compact: true,
    value: (ds) => additional(ds)?.['wb_type_cd'] || '',
  },
  {
    key: 'datum',
    title: 'Datum',
    sort: true,
    compact: true,
    value: (_ds, _d, date) =>
      date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    sortValue: (row) => row.datum_uhrzeit,
  },
  {
    key: 'uhrzeit',
    title: 'Uhrzeit',
    sort: true,
    compact: true,
    value: (_ds, _d, date) =>
      date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    sortValue: (row) => row.datum_uhrzeit,
  },
  {
    key: 'fisch_art',
    title: 'Fisch Art',
    sort: true,
    value: (ds) => additional(ds)?.['art'] || '',
  },
  {
    key: 'muschel_art',
    title: 'Muschel Art',
    sort: true,
    value: (ds) => additional(ds)?.['art'] || '',
  },
  {
    key: 'organ_name',
    title: 'organischer Name',
    sort: true,
    value: (ds) => additional(ds)?.['organ_name'] || '',
  },
  {
    key: 'anzahl_fische',
    title: 'Anzahl Fische in Probe',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['anzahl'] ?? '',
  },
  {
    key: 'anzahl_muscheln',
    title: 'Anzahl Muscheln in Probe',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['anzahl'] ?? '',
  },
  {
    key: 'laenge_min',
    title: 'Länge Min in cm',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['laenge_min'] ?? '',
  },
  {
    key: 'laenge_max',
    title: 'Länge Max in cm',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['laenge_max'] ?? '',
  },
  {
    key: 'laenge_mit',
    title: 'mittlere Länge in cm',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['laenge_mit'] ?? '',
  },
  {
    key: 'laenge_std',
    title: 'Standardabweichung Länge in cm',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['laenge_std'] ?? '',
  },
  {
    key: 'alter_mit',
    title: 'mittleres Alter der Probe',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['alter_mit'] ?? '',
  },
  {
    key: 'biota_fm',
    title: 'Frischmasse',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['biota_fm'] ?? '',
  },
  {
    key: 'fm_einheit',
    title: 'Einheit Frischmasse',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['fm_einheit'] || '',
  },
  {
    key: 'biota_tm',
    title: 'Trockenmasse',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['biota_tm'] ?? '',
  },
  {
    key: 'tm_einheit',
    title: 'Einheit Trockenmasse',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['tm_einheit'] || '',
  },
  {
    key: 'tm_relativ',
    title: 'Trockenmasse relativ',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['tm_relativ'] ?? '',
  },
  {
    key: 'tm_relativ_einheit',
    title: 'Einheit Trockenmasse',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['tm_relativ_einheit'] || '',
  },
  {
    key: 'fettgehalt',
    title: 'Fettgehalt',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['fettgehalt'] ?? '',
  },
  {
    key: 'fettgehalt_einheit',
    title: 'Einheit Fettgehalt',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['fettgehalt_einheit'] || '',
  },
  {
    key: 'konditionsindex',
    title: 'Konditionsindex',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['konditionsindex'] ?? '',
  },
  {
    key: 'konditionsindex_einheit',
    title: 'Einheit Konditionsindex',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['konditionsindex_einheit'] || '',
  },
  {
    key: 'matrix',
    title: 'Matrix',
    sort: true,
    value: (ds) => additional(ds)?.['matrix'] || '',
  },
  {
    key: 'methode',
    title: 'Methode',
    sort: true,
    value: (_ds, d) => d.parameter?.['methode'] || '',
  },
  {
    key: 'param_kurz',
    title: 'Parameter-Kurz',
    sort: true,
    value: (ds) => ds.description.phenomenonLabel || '',
  },
  {
    key: 'parameter',
    title: 'Parameter',
    sort: true,
    value: (ds) => additional(ds)?.['observedProperty']?.definition || '',
  },
  {
    key: 'param_gruppen',
    title: 'Parameter-Gruppe',
    sort: true,
    compact:true,
    value: (ds) => (additional(ds)?.['phenomenon_group'] || []).join('; '),
  },
  {
    key: 'vorzeichen',
    title: 'Vorzeichen',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['vorzeichen'] || '',
  },
  {
    key: 'wert',
    title: 'Wert',
    sort: true,
    compact: true,
    value: (_ds, d) => d.value,
  },
  {
    key: 'einheit',
    title: 'Einheit',
    sort: true,
    compact: true,
    value: (ds) => ds.description.uom,
  },
  {
    key: 'tiefe',
    title: 'Tiefe',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['tiefe'] || '',
  },
  {
    key: 'tiefenstufe',
    title: 'Tiefenstufe',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['tiefenstufe'] || '',
  },
  {
    key: 'zeitstempel',
    title: 'Zeitstempel',
    tableHidden: true,
    value: (_ds, d) => moment(d.timestamp).format(),
  },
  {
    key: 'tiefe_misch_von_m',
    title: 'Mischtiefe von',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['tiefe_misch_von_m'] || '',
  },
  {
    key: 'tiefe_misch_bis_m',
    title: 'Mischtiefe bis',
    sort: true,
    compact: true,
    value: (_ds, d) => d.parameter?.['tiefe_misch_bis_m'] || '',
  },
];

const COLUMNS_BY_KEY = new Map(COLUMNS.map((c) => [c.key, c]));

const CHM_FGKGSG_KEYS: string[] = [
  'gew_art',
  'bundesland',
  'mst_nr',
  'ort',
  'gewässername',
  'wb_cd',
  'wb_type_cd',
  'datum',
  'uhrzeit',
  'matrix',
  'methode',
  'param_kurz',
  'parameter',
  'param_gruppen',
  'vorzeichen',
  'wert',
  'einheit',
  'tiefe',
  'tiefenstufe',
  'tiefe_misch_von_m',
  'tiefe_misch_bis_m',
  'zeitstempel',
];

const BIOTA_FISH_KEYS: string[] = [
  'gew_art',
  'bundesland',
  'mst_nr',
  'ort',
  'gewässername',
  'wb_cd',
  'wb_type_cd',
  'datum',
  'uhrzeit',
  'fisch_art', // art
  'organ_name',
  'anzahl_fische', // anzahl
  'alter_mit',
  'tm_relativ',
  'tm_relativ_einheit',
  'fettgehalt',
  'fettgehalt_einheit',
  'matrix',
  'parameter',
  'param_gruppen', // par_gruppe
  'vorzeichen',
  'wert', // wert
  'einheit',
  'zeitstempel',
];

const BIOTA_MUSCHEL_KEYS: string[] = [
  'gew_art',
  'bundesland',
  'mst_nr',
  'ort',
  'gewässername',
  'wb_cd',
  'wb_type_cd',
  'datum',
  'uhrzeit',
  'muschel_art', // art
  'anzahl_muscheln', // anzahl
  'laenge_min',
  'laenge_max',
  'laenge_mit',
  'laenge_std',
  'fettgehalt',
  'fettgehalt_einheit',
  'konditionsindex',
  'konditionsindex_einheit',
  'biota_fm',
  'fm_einheit',
  'biota_tm',
  'tm_einheit',
  'tm_relativ', // biota_tm_relativ
  'tm_relativ_einheit',
  'matrix',
  'parameter',
  'param_gruppen',
  'vorzeichen',
  'wert',
  'einheit',
  'zeitstempel',
];

/**
 * Hardcoded colums
 */
export const MATRIX_COLUMNS: Record<string, string[]> = {
  Wasserphase: CHM_FGKGSG_KEYS,
  'Feststoffphase, Sedimente': CHM_FGKGSG_KEYS,
  'Feststoffphase, Schwebstoffe': CHM_FGKGSG_KEYS,
  'Biota - Fische': BIOTA_FISH_KEYS,
  'Biota - Muschel': BIOTA_MUSCHEL_KEYS,
};

/** fallback for matrix types not listed in MATRIX_COLUMNS */
export const DEFAULT_COLUMN_KEYS = CHM_FGKGSG_KEYS;

export function columnKeysForMatrix(matrix: string): string[] {
  return MATRIX_COLUMNS[matrix?.trim()] ?? DEFAULT_COLUMN_KEYS;
}

export function columnDefsForMatrix(matrix: string): ColumnDef[] {
  return columnKeysForMatrix(matrix)
    .map((key) => COLUMNS_BY_KEY.get(key))
    .filter((c): c is ColumnDef => c !== undefined);
}

/**
 * Union of the columns applicable to the given rows, in the order of COLUMNS.
 */
export function columnsForRows(
  rows: TableRow[],
  opts: { includeHidden?: boolean } = {},
): ColumnDef[] {
  const keys = new Set<string>(rows.length === 0 ? DEFAULT_COLUMN_KEYS : []);
  new Set(rows.map((r) => r.matrix)).forEach((matrix) =>
    columnKeysForMatrix(matrix).forEach((k) => keys.add(k)),
  );
  return COLUMNS.filter(
    (c) => keys.has(c.key) && (opts.includeHidden || !c.tableHidden),
  );
}

export function cellValue(row: TableRow, key: string): CellValue {
  return key in row.values ? row.values[key] : NOT_APPLICABLE;
}
