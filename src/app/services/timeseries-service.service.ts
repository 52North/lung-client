import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Injectable, inject } from '@angular/core';
import {
  BarRenderingHints,
  ColorService,
  DatasetType,
  HelgolandDataset,
  HelgolandServicesConnector,
  HelgolandTimeseries,
  HelgolandTimeseriesData,
  LineRenderingHints,
  LocalStorage,
  SumValuesService,
  Time,
  Timespan,
  TimeValueTuple,
} from '@helgoland/core';
import {
  AxisSettings,
  BarStyle,
  D3SeriesGraphErrorHandler,
  D3SeriesSimpleGraphErrorHandler,
  DatasetStyle,
  GraphDataEntry,
  LineStyle,
  SeriesGraphDataset,
  TimeseriesChild,
} from '@helgoland/d3';
import { TranslateService } from '@ngx-translate/core';
import { Duration, duration, unitOfTime } from 'moment';

import { Favorite } from './favorite.service';
import { DatasetsService } from './graph-datasets.service';
import { NotifierService } from './notifier.service';
import {
  DatasetFavoriteService,
  DatasetStateService,
} from './service-interfaces';

const TIMESERIES_STATE_LOCALSTORAGE = 'timeseries-state';
const TIMESERIES_FAVORITES_LOCALSTORAGE = 'timeseries-favorites';

const FAVORITE_PREFIX = 'ts_fav_';
interface SaveState {
  style: DatasetStyle;
  yaxis: AxisSettings;
  selected: boolean;
  visible: boolean;
}

interface FavoriteSaveState {
  favorite: Favorite;
  style: DatasetStyle;
  yAxis: AxisSettings;
}

export abstract class TimeseriesService {
  abstract addDataset(internalId: string): void;
  abstract hasDataset(id: string): boolean;
  abstract getDataset(internalId: string): HelgolandTimeseries | undefined;
  abstract removeDataset(id: string): void;
}

@Injectable({
  providedIn: 'root',
})
export class TimeseriesServiceImpl
  implements TimeseriesService, DatasetStateService, DatasetFavoriteService
{
  protected servicesConnector = inject(HelgolandServicesConnector);
  protected localStorage = inject(LocalStorage);
  protected timeSrvc = inject(Time);
  protected sumValues = inject(SumValuesService);
  protected colorService = inject(ColorService);
  protected translate = inject(TranslateService);
  protected graphDatasetsSrvc = inject(DatasetsService);
  protected errorHandler = inject(D3SeriesGraphErrorHandler, {
    optional: true,
  })!;
  protected notifier = inject(NotifierService);
  protected la = inject(LiveAnnouncer);

  private state = new Map<string, SaveState>();
  private favorites: {
    [key: string]: FavoriteSaveState;
  } = {};
  private datasetMap: Map<string, HelgolandTimeseries> = new Map();
  private datasetFetchedMap: Map<string, Timespan> = new Map();
  private datasetCache: Map<string, HelgolandTimeseriesData> = new Map();
  private timespan: Timespan | undefined = undefined;

  private presenterOptions = {
    sendDataRequestOnlyIfDatasetTimespanCovered: true,
    requestBeforeAfterValues: false,
    showReferenceValues: true,
    generalizeAllways: true,
    timespanBufferFactor: 0.2,
  };

  constructor() {
    this.graphDatasetsSrvc.timespanChanged.subscribe((newTimespan) => {
      //const oldTimespan = this.timespan ?? new Timespan(Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
      this.timespan = newTimespan;
      // Only reload data if something significant has changed!
      // find out what has actually changed

      // expandedBack = new Timespan starts (time-wise) earlier
      // expandedForward = new Timespan ends (time-wise) later
      //const expandedBack = newTimespan.from < oldTimespan.from;
      //const expandedForward = newTimespan.to > oldTimespan.to;

      // New timespan is smaller than previous timespan - no data-update needed
      //if (!(expandedBack || expandedForward)) {
      //  console.log("timespan shrank - nothing to fetch")
      //  return;
      //}

      // Check if each Dataset actually contains data in the relevant timespan
      this.datasetMap.forEach((dataset) => {
        // If the old span did include all values, the timeseries only shrank
        const fetchSpan =
          this.datasetFetchedMap.get(dataset.internalId) ??
          new Timespan(Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
        let needFetch = false;

        if (
          (dataset.firstValue &&
            this.graphDatasetsSrvc.overviewTimespan!.to <
              dataset.firstValue.timestamp) ||
          (dataset.lastValue &&
            this.graphDatasetsSrvc.overviewTimespan!.from >
              dataset.lastValue.timestamp)
        ) {
          // Timeseries does not appear in overviewgraph nor diagram itself
          // We can skip all processing
          // console.log("We can skip all processing")
          return;
        }

        // We need to fetch if the already fetched data did not include all values
        if (
          dataset.firstValue &&
          dataset.firstValue.timestamp < fetchSpan.from
        ) {
          needFetch = true;
        }
        if (dataset.lastValue && dataset.lastValue.timestamp > fetchSpan.to) {
          needFetch = true;
        }

        // Refetch data
        if (needFetch) {
          this.loadDatasetData(dataset.internalId);
        } else {
          // We cull the data to prevent out-of-view timeseries rendering
          // As overviewDatasets are generalized, we do not cull them
          if (
            this.graphDatasetsSrvc.getDatasetEntry(dataset.internalId).visible
          ) {
            this.prepareData(
              dataset,
              this.datasetCache.get(dataset.internalId)!,
              newTimespan,
            );
          } else {
            this.graphDatasetsSrvc.setDataLoading(
              dataset.internalId,
              false,
              false,
            );
          }
        }
      });
    });
    if (!this.errorHandler) {
      this.errorHandler = new D3SeriesSimpleGraphErrorHandler();
    }
    this.loadFavorites();

    this.graphDatasetsSrvc.datasetStateChanged.subscribe((ds) => {
      this.setState(ds.id, ds.style, ds.yAxis, ds.selected, ds.visible);
      this.saveState();
    });

    this.graphDatasetsSrvc.datasetRemoved.subscribe((id) => {
      this.removeDataset(id);
    });
  }

  getDataset(internalId: string): HelgolandTimeseries | undefined {
    return this.datasetMap.get(internalId);
  }

  async addDataset(internalId: string) {
    this.addDatasetbyId(internalId);
  }

  getDatasets(): string[] {
    return [];
  }

  hasDataset(id: string): boolean {
    return this.graphDatasetsSrvc.hasDataset(id);
  }

  removeDataset(id: string) {
    this.graphDatasetsSrvc.deleteDataset(id, true);
    this.datasetMap.delete(id);
    this.datasetFetchedMap.delete(id);
    this.datasetCache.delete(id);
    this.state.delete(id);
    this.saveState();
  }

  getPermaId(ds: SeriesGraphDataset): string | undefined {
    const match = this.datasetMap.get(ds.id);
    if (match) {
      return this.encodeState(ds);
    } else {
      return undefined;
    }
  }

  private encodeState(ds: SeriesGraphDataset): string {
    const selected = ds.selected ? 't' : 'f';
    const visible = ds.visible ? 't' : 'f';
    const seperateYAxis = ds.yAxis.separate ? 't' : 'f';
    let style;
    if (ds.style instanceof LineStyle) {
      const styleArr = [
        ds.style.baseColor,
        ds.style.lineWidth,
        ds.style.pointRadius,
        ds.style.pointSymbol,
      ];
      style = JSON.stringify(styleArr);
    }
    return `ts_${ds.id}|${selected}|${visible}|${seperateYAxis}|${style}`;
  }

  private decodeState(str: string) {
    if (str.startsWith('ts_')) {
      str = str.substring(3);
      const [idStr, selectedStr, visibleStr, seperateYaxisStr, styleArrayStr] =
        str.split('|');
      let selected = undefined;
      if (selectedStr === 'f' || selectedStr === 't') {
        selected = selectedStr === 't';
      }
      let visible = undefined;
      if (visibleStr === 'f' || visibleStr === 't') {
        visible = visibleStr === 't';
      }
      let axis = undefined;
      if (seperateYaxisStr === 'f' || seperateYaxisStr === 't') {
        axis = new AxisSettings();
        axis.separate = seperateYaxisStr === 't';
      }
      let style = undefined;
      if (styleArrayStr) {
        const styleArr = JSON.parse(styleArrayStr);
        if (styleArr instanceof Array) {
          const [baseColor, lineWidth, pointRadius, pointSymbol] = styleArr;
          style = new LineStyle(baseColor, pointRadius, lineWidth, pointSymbol);
        }
      }
      this.addDatasetbyId(idStr, style, axis, visible, selected);
      return true;
    }
    return false;
  }

  validatePermaId(id: string): boolean {
    return this.decodeState(id);
  }

  canHandleDatasetAsFavorite(id: string): boolean {
    return id.startsWith(FAVORITE_PREFIX) || this.datasetMap.has(id);
  }

  isFavorite(id: string): boolean {
    return this.favorites[this.createFavoriteID(id)] !== undefined;
  }

  getFavorites(): Favorite[] {
    const favorites: Favorite[] = [];
    for (const key in this.favorites) {
      favorites.push(this.favorites[key].favorite);
    }
    return favorites;
  }

  getFavorite(id: string): Favorite {
    return this.favorites[this.createFavoriteID(id)].favorite;
  }

  createFavorite(ds: SeriesGraphDataset): Favorite {
    const favState: FavoriteSaveState = {
      favorite: {
        id: this.createFavoriteID(ds.id),
        label: `${ds.description.phenomenonLabel} @ ${ds.description.platformLabel} (${ds.description.procedureLabel})`,
        description: ds.description,
      },
      style: ds.style,
      yAxis: ds.yAxis,
    };
    this.favorites[this.createFavoriteID(ds.id)] = favState;
    this.saveFavorites();
    return favState.favorite;
  }

  private createFavoriteID(dsId: string): string {
    return `${FAVORITE_PREFIX}${dsId}`;
  }

  updateFavoriteLabel(fav: Favorite, label: string) {
    if (this.favorites[fav.id]) {
      this.favorites[fav.id].favorite.label = label;
    }
    this.saveFavorites();
  }

  addFavoriteToDiagram(fav: Favorite) {
    const dsId = fav.id.substring(FAVORITE_PREFIX.length);
    if (!this.datasetMap.has(dsId)) {
      const entry = this.favorites[fav.id];
      const style = this.getStyleOfObject(entry.style);
      const yaxis = this.getYAxisOfObject(entry.yAxis);
      this.addDatasetbyId(dsId, style, yaxis);
    }
  }

  removeFavorite(id: string) {
    delete this.favorites[id];
    this.saveFavorites();
  }

  private loadFavorites(): void {
    this.favorites =
      this.localStorage.load(TIMESERIES_FAVORITES_LOCALSTORAGE) || {};
  }

  private saveFavorites(): void {
    this.localStorage.save(TIMESERIES_FAVORITES_LOCALSTORAGE, this.favorites);
  }

  protected saveState(): void {
    this.localStorage.save(
      TIMESERIES_STATE_LOCALSTORAGE,
      Array.from(this.state),
    );
  }

  handleStoredDs(dsId: string): boolean {
    const state: Array<[id: string, state: any]> =
      this.localStorage.load(TIMESERIES_STATE_LOCALSTORAGE) || [];
    const match = state.find((e) => e[0] === dsId);
    if (match && match[1]) {
      try {
        const visible = match[1].visible;
        const selected = match[1].selected;
        const style = this.getStyleOfObject(match[1].style);
        const axis = this.getYAxisOfObject(match[1].yaxis);
        this.addDatasetbyId(dsId, style, axis, visible, selected);
        return true;
      } catch (error) {
        console.warn(`Could not parse styles for entry with id ${dsId}`);
        return false;
      }
    }
    return false;
  }

  protected addDatasetbyId(
    id: string,
    style?: DatasetStyle,
    axis?: AxisSettings,
    visible?: boolean,
    selected?: boolean,
  ): void {
    this.graphDatasetsSrvc.startLoadingDataset(id);
    this.servicesConnector
      .getDataset(id, {
        locale: this.translate.currentLang,
        type: DatasetType.Timeseries,
      })
      .subscribe({
        next: (res) =>
          this.loadAddedDataset(res, style, axis, visible, selected),
        error: (error) => {
          this.graphDatasetsSrvc.stopLoadingDatasetOnError(id);
          return this.errorHandler.handleDatasetLoadError(error);
        },
      });
  }

  protected loadAddedDataset(
    ts: HelgolandDataset,
    dsStyle?: DatasetStyle,
    dsAxis?: AxisSettings,
    visible = true,
    selected = false,
  ): void {
    if (ts instanceof HelgolandTimeseries) {
      const message = `${this.translate.instant('events.add-timeseries')}: ${
        ts.label
      }`;
      this.la.announce(message);
      this.notifier.notify(message);
      this.datasetMap.set(ts.internalId, ts);
      const style = dsStyle ? dsStyle : this.createStyle(ts);
      const yaxis = dsAxis ? dsAxis : this.createYAxis(ts);
      const dataset = new SeriesGraphDataset(
        ts.internalId,
        style,
        yaxis,
        visible,
        selected,
        {
          uom: ts.uom,
          phenomenonLabel: ts.parameters.phenomenon?.label,
          platformLabel: ts.platform.label,
          procedureLabel: ts.parameters.procedure?.label,
          categoryLabel: ts.parameters.category?.map((e) => e.label),
          featureLabel: ts.parameters.feature?.label,
          firstValue: ts.firstValue,
          lastValue: ts.lastValue,
          additional: ts.parameters.additional,
        },
      );
      this.setState(dataset.id, style, yaxis, selected, visible);
      this.saveState();
      this.graphDatasetsSrvc.addOrUpdateDataset(dataset);
      ts.referenceValues?.forEach((ref) => {
        dataset.addChild(
          new TimeseriesChild(
            ref.referenceValueId,
            ref.label,
            ref.visible || false,
            [],
            this.colorService.getColor(),
          ),
        );
      });
      this.loadDatasetData(ts.internalId);
    } else {
      // console.error(`Dataset with internal id ${dataset.internalId} is not HelgolandTimeseries`);
    }
  }

  private createYAxis(ds: HelgolandTimeseries): AxisSettings {
    const axisSettings = new AxisSettings();
    if (ds.renderingHints?.chartType === 'bar') {
      axisSettings.range = { min: 0 };
    }
    return axisSettings;
  }

  private createStyle(ds: HelgolandTimeseries): DatasetStyle {
    if (ds.renderingHints && ds.renderingHints.chartType) {
      switch (ds.renderingHints.chartType) {
        case 'line':
          return this.handleLineRenderingHints(
            ds.renderingHints as LineRenderingHints,
          );
        case 'bar':
          return this.handleBarRenderingHints(
            ds.renderingHints as BarRenderingHints,
          );
      }
    }
    return new LineStyle(this.colorService.getColor(), 2, 2);
  }

  private getStyleOfObject(style: any): DatasetStyle {
    if (style.period) {
      return new BarStyle(
        style.baseColor,
        style.startOf,
        duration(style.period),
        style.lineWidth,
        style.lineDashArray,
      );
    } else {
      return new LineStyle(
        style.baseColor,
        style.pointRadius,
        style.lineWidth,
        style.pointSymbol,
        style.lineDashArray,
      );
    }
  }

  private getYAxisOfObject(yaxis: AxisSettings): AxisSettings {
    return new AxisSettings(
      yaxis.showSymbolOnAxis,
      yaxis.separate,
      yaxis.zeroBased,
      yaxis.autoRangeSelection,
      yaxis.range,
    );
  }

  protected handleLineRenderingHints(
    lineHints: LineRenderingHints,
  ): DatasetStyle {
    const color = lineHints.properties?.color || this.colorService.getColor();
    let lineWidth = 2;
    if (lineHints && lineHints.properties.width) {
      lineWidth = Math.round(parseFloat(lineHints.properties.width));
    }
    return new LineStyle(color, lineWidth, lineWidth);
  }

  protected handleBarRenderingHints(barHints: BarRenderingHints): DatasetStyle {
    let lineWidth = 2;
    let startOf: unitOfTime.StartOf = 'day';
    let period: Duration = duration('P1D');
    if (barHints && barHints.properties.width) {
      lineWidth = Math.round(parseFloat(barHints.properties.width));
    }
    const color = barHints.properties?.color || this.colorService.getColor();
    if (barHints && barHints.properties.interval) {
      if (barHints.properties.interval === 'byDay') {
        period = duration('P1D');
        startOf = 'day';
      }
      if (barHints.properties.interval === 'byHour') {
        period = duration('PT1H');
        startOf = 'hour';
      }
    }
    return new BarStyle(color, startOf, period, lineWidth);
  }

  private setState(
    id: string,
    style: DatasetStyle,
    yaxis: AxisSettings,
    selected: boolean,
    visible: boolean,
  ) {
    const dsState: SaveState = {
      style: style,
      yaxis: yaxis,
      selected: selected,
      visible: visible,
    };
    this.state.set(id, dsState);
  }

  private loadDatasetData(id: string) {
    if (this.graphDatasetsSrvc.overviewTimespan) {
      const graphDS = this.graphDatasetsSrvc.getDatasetEntry(id);
      const dataset = this.datasetMap.get(id);
      if (!dataset || !graphDS) return;

      this.graphDatasetsSrvc.setOverviewDataLoading(id, true);
      this.graphDatasetsSrvc.setDataLoading(id, true, graphDS.visible);

      const buffer = this.graphDatasetsSrvc.overviewTimespan;
      this.servicesConnector
        .getDatasetData(dataset, buffer, {
          expanded: this.presenterOptions.showReferenceValues,
        })
        .subscribe({
          next: (result) => {
            // Store data + requested timespan
            this.datasetCache.set(dataset.internalId, result);
            this.datasetFetchedMap.set(dataset.internalId, buffer);

            this.prepareOverviewData(
              dataset,
              result,
              this.graphDatasetsSrvc.overviewTimespan!,
            );
            this.prepareData(dataset, result, this.graphDatasetsSrvc.timespan!);
          },
          error: (error) => {
            const message = this.translate.instant(
              'diagram-view.error-loading-overview-data',
            );
            const label = `${dataset.parameters.phenomenon?.label} @ ${dataset.platform.label}`;
            this.notifier.notify(`${message} ${label}`);
            this.graphDatasetsSrvc.setOverviewDataLoading(id, false);
            this.errorHandler.handleDataLoadError(error, dataset);
          },
        });
    }
  }

  private prepareData(
    dataset: HelgolandTimeseries,
    rawdata: HelgolandTimeseriesData,
    timespan: Timespan,
  ): void {
    const ds = this.graphDatasetsSrvc
      .getDatasetEntry(dataset.internalId)
      .clone();
    const firstInside = rawdata.values.findIndex(
      (tvt) => tvt[0] >= timespan.from,
    );
    const lastInside = rawdata.values.findLastIndex(
      (tvt) => tvt[0] <= timespan.to,
    );

    const startIndex = Math.max(0, firstInside - 1);
    const endIndex =
      lastInside === -1
        ? rawdata.values.length
        : Math.min(rawdata.values.length, lastInside + 2);

    const data: GraphDataEntry[] = rawdata.values
      .slice(startIndex, endIndex)
      .map((e) => ({
        timestamp: e[0],
        value: e[1].value,
        parameter: e[1].parameter,
      }));

    if (data.length > 0) {
      ds.setData(data);
      this.graphDatasetsSrvc.updateDatasetWithData(ds.id, ds);
    }

    this.addReferenceValueDatasets(ds, rawdata);
    this.graphDatasetsSrvc.setDataLoading(ds.id, false, ds.visible);
  }

  private addReferenceValueDatasets(
    ds: SeriesGraphDataset,
    rawdata: HelgolandTimeseriesData,
  ) {
    if (ds.children && ds.children.length) {
      ds.children.forEach((child) => {
        if (child instanceof TimeseriesChild) {
          const refVals = rawdata.referenceValues[child.id];
          if (refVals) {
            child.setData(this.createReferenceValueData(rawdata, child.id));
          }
        }
      });
    }
  }

  private createReferenceValueData(
    data: HelgolandTimeseriesData,
    refId: string,
  ): GraphDataEntry[] {
    let refValues = data.referenceValues[refId] as any;
    if (!(refValues instanceof Array)) {
      if (refValues.valueBeforeTimespan) {
        refValues.values.unshift(refValues.valueBeforeTimespan);
      }
      if (refValues.valueAfterTimespan) {
        refValues.values.push(refValues.valueAfterTimespan);
      }
      refValues = refValues.values;
    }
    return refValues.map((d: any) => ({ timestamp: d[0], value: d[1].value }));
  }

  private prepareOverviewData(
    dataset: HelgolandTimeseries,
    rawdata: HelgolandTimeseriesData,
    timespan: Timespan,
  ): void {
    if (rawdata instanceof HelgolandTimeseriesData) {
      // Generalization to clean up OverviewGraph
      // We try to reduce to 25 Datapoints, or 10% if the Dataset is larger than REDUCTION_FACTOR
      const FACTOR = 25;
      const REDUCTION_FACTOR =
        rawdata.values.length < FACTOR * 10
          ? FACTOR
          : Math.floor(rawdata.values.length / 10);

      const rawDataMapped = rawdata.values.map((e) => ({
        timestamp: e[0],
        value: e[1].value,
      }));

      let data;
      if (rawDataMapped.length > REDUCTION_FACTOR * 3) {
        // Pass the data and target number of points (threshold)
        const start = rawDataMapped.at(0)!.timestamp;
        const end = rawDataMapped.at(rawDataMapped.length - 1)!.timestamp;
        data = this.timeAlignedLttbdata(rawDataMapped, start, end);
      } else {
        data = rawDataMapped;
      }

      const ds = this.graphDatasetsSrvc
        .getOverviewDatasetEntry(dataset.internalId)
        .clone();
      ds.setData(data);
      this.graphDatasetsSrvc.updateOverviewDatasetWithData(ds.id, ds);
      this.graphDatasetsSrvc.setOverviewDataLoading(dataset.internalId, false);
    }
  }

  /**
   * Downsamples data using the Largest Triangle Three Buckets algorithm.
   * @param {GraphDataEntry[]} data - Array of objects: { timestamp: number, value: number }
   * @param {number} threshold - The number of data points to return
   */
  private lttb(data: GraphDataEntry[], threshold: number): GraphDataEntry[] {
    const dataLength = data.length;
    if (threshold >= dataLength || threshold === 0) {
      return data;
    }

    const sampled: GraphDataEntry[] = [];
    let sampledIndex = 0;

    // Bucket size. Leave room for start and end data points
    const every = (dataLength - 2) / (threshold - 2);

    let a = 0;
    let maxAreaPoint;
    let nextA;

    sampled[sampledIndex++] = data[a]; // Always add the first point

    for (let i = 0; i < threshold - 2; i++) {
      // Calculate point average for next bucket (containing c)
      let avgX = 0;
      let avgY = 0;
      let avgRangeStart = Math.floor((i + 1) * every) + 1;
      let avgRangeEnd = Math.floor((i + 2) * every) + 1;
      avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;

      const avgRangeLength = avgRangeEnd - avgRangeStart;

      for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
        avgX += data[avgRangeStart].timestamp;
        avgY += data[avgRangeStart].value;
      }
      avgX /= avgRangeLength;
      avgY /= avgRangeLength;

      // Get the range for this bucket
      let rangeOffs = Math.floor((i + 0) * every) + 1;
      const rangeTo = Math.floor((i + 1) * every) + 1;

      // Point a
      const pointAX = data[a].timestamp;
      const pointAY = data[a].value;

      let maxArea = -1;
      let area = -1;

      for (; rangeOffs < rangeTo; rangeOffs++) {
        // Calculate triangle area over three buckets
        area =
          Math.abs(
            (pointAX - avgX) * (data[rangeOffs].value - pointAY) -
              (pointAX - data[rangeOffs].timestamp) * (avgY - pointAY),
          ) * 0.5;

        if (area > maxArea) {
          maxArea = area;
          maxAreaPoint = data[rangeOffs];
          nextA = rangeOffs;
        }
      }

      sampled[sampledIndex++] = maxAreaPoint!; // Pick this point from the bucket
      a = nextA!; // This a is the next a (chosen b)
    }

    sampled[sampledIndex++] = data[dataLength - 1]; // Always add last

    return sampled;
  }

  /**
   * Downsamples data using LTTB, anchored to 50 absolute time buckets.
   * @param {Array} data - Array of objects: { timestamp: number, value: number }
   * @param {number} timeStart - The absolute start UNIX timestamp of the view window
   * @param {number} timeEnd - The absolute end UNIX timestamp of the view window
   * @returns {Array} - The downsampled data
   */
  private timeAlignedLttbdata(
    data: GraphDataEntry[],
    timeStart: number,
    timeEnd: number,
  ): GraphDataEntry[] {
    // Edge case: not enough data to downsample
    if (!data || data.length <= 2) return data;

    const BUCKET_COUNT = 50;
    const bucketDuration = (timeEnd - timeStart) / BUCKET_COUNT;

    // 1. Initialize 50 empty buckets
    const buckets = Array.from(
      { length: BUCKET_COUNT },
      () => [] as GraphDataEntry[],
    );

    // 2. Assign each datapoint to a fixed time bucket
    for (let i = 0; i < data.length; i++) {
      const pt = data[i];

      // Ignore data that falls outside the current viewing window
      if (pt.timestamp < timeStart || pt.timestamp > timeEnd) continue;

      // Calculate absolute bucket index (0 to 49)
      let bucketIdx = Math.floor((pt.timestamp - timeStart) / bucketDuration);

      // Safeguard: Ensure a point exactly on timeEnd goes into the last bucket
      if (bucketIdx >= BUCKET_COUNT) bucketIdx = BUCKET_COUNT - 1;

      buckets[bucketIdx].push(pt);
    }

    // 3. Filter out empty buckets to handle massive data gaps safely
    const validBuckets = buckets.filter((bucket) => bucket.length > 0);

    // If the data is so sparse we only populated 1 or 2 buckets, just return the extremes
    if (validBuckets.length <= 2) {
      const firstPt = validBuckets[0][0];
      const lastBucket = validBuckets[validBuckets.length - 1];
      const lastPt = lastBucket[lastBucket.length - 1];
      return firstPt === lastPt ? [firstPt] : [firstPt, lastPt];
    }

    // 4. Apply LTTB math across the contiguous non-empty buckets
    const sampled: GraphDataEntry[] = [];

    // Always select the first point of the first valid bucket
    let a = validBuckets[0][0];
    sampled.push(a);

    // Loop through middle buckets
    for (let i = 1; i < validBuckets.length - 1; i++) {
      const currentBucket = validBuckets[i];
      const nextBucket = validBuckets[i + 1];

      // Calculate the average X and Y of the NEXT valid bucket
      let avgX = 0;
      let avgY = 0;
      for (let j = 0; j < nextBucket.length; j++) {
        avgX += nextBucket[j].timestamp;
        avgY += nextBucket[j].value;
      }
      avgX /= nextBucket.length;
      avgY /= nextBucket.length;

      const pointAX = a.timestamp;
      const pointAY = a.value;

      let maxArea = -1;
      let maxAreaPoint = currentBucket[0];

      // Find the point in the CURRENT bucket that creates the largest triangle
      for (let j = 0; j < currentBucket.length; j++) {
        const pt = currentBucket[j];
        const area =
          Math.abs(
            (pointAX - avgX) * (pt.value - pointAY) -
              (pointAX - pt.timestamp) * (avgY - pointAY),
          ) * 0.5;

        if (area > maxArea) {
          maxArea = area;
          maxAreaPoint = pt;
        }
      }

      sampled.push(maxAreaPoint);
      a = maxAreaPoint; // This chosen point becomes 'a' for the next iteration
    }

    // Always add the very last point of the last valid bucket
    const lastBucket = validBuckets[validBuckets.length - 1];
    sampled.push(lastBucket[lastBucket.length - 1]);

    return sampled;
  }
}
