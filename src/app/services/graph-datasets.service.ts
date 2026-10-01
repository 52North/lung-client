import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  EventEmitter,
  Injectable,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Time, Timespan, TimezoneService } from '@helgoland/core';
import { SeriesGraphDataset } from '@helgoland/d3';
import { TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import { Subject } from 'rxjs';

import { ConfigurationService } from './configuration.service';
import { NotifierService } from './notifier.service';
import { StorageService } from './storage-service.service';

const TIME_CACHE_PARAM = 'timeseriesTime';

export class LoadingDataset {
  constructor(private _id: string) {}
  get id(): string {
    return this._id;
  }

  dataLoading: boolean = true;

  //clone method that accepts partial overrides
  clone(overrides: Partial<LoadingDataset> = {}): LoadingDataset {
    const copy = new LoadingDataset(this.id);
    Object.assign(copy, this, overrides);
    return copy;
  }
}

export const LIMIT_VISIBLE_DATASETS = 10;

@Injectable({
  providedIn: 'root',
})
export class DatasetsService {
  protected timeSrvc = inject(Time);
  protected translate = inject(TranslateService);
  protected la = inject(LiveAnnouncer);
  protected timezoneSrvc = inject(TimezoneService);
  protected notifier = inject(NotifierService);
  protected storageSrvc = inject(StorageService);
  protected configSrvc = inject(ConfigurationService);

  timespanChanged: EventEmitter<Timespan> = new EventEmitter();

  private _datasets: WritableSignal<(SeriesGraphDataset | LoadingDataset)[]> =
    signal([]);
  overviewDatasets: WritableSignal<SeriesGraphDataset[]> = signal([]);

  readonly datasetAdded: Subject<string> = new Subject();
  readonly datasetRemoved: Subject<string> = new Subject();
  readonly datasetStateChanged = new Subject<SeriesGraphDataset>();

  private _loadingVisibleData: Set<string> = new Set();
  loadingVisibleDataStatus: EventEmitter<boolean> = new EventEmitter();

  private _loadingBackgroundData: Set<string> = new Set();
  loadingBackgroundDataStatus: EventEmitter<boolean> = new EventEmitter();

  private _loadingOverviewData: Set<string> = new Set();
  loadingOverviewDataStatus: EventEmitter<boolean> = new EventEmitter();

  visibleDatasetCount = signal(0);
  visibilityLimitReached = computed(
    () => this.visibleDatasetCount() >= LIMIT_VISIBLE_DATASETS,
  );

  private _timespan: Timespan | undefined;

  get timespan(): Timespan | undefined {
    return this._timespan;
  }

  get overviewTimespan(): Timespan | undefined {
    if (this._timespan) {
      return this.timeSrvc.getBufferedTimespan(this._timespan, 2);
    }
    return undefined;
  }

  readonly allDatasets = computed(() => [...this._datasets()]);
  readonly datasets = computed(() => [
    ...this._datasets().filter((ds) => ds instanceof SeriesGraphDataset),
  ]);

  set timespan(ts: Timespan) {
    const message = `${this.translate.instant(
      'events.timespan-changed-from',
    )} ${this.timezoneSrvc.formatTzDate(ts.from)} ${this.translate.instant(
      'events.timespan-changed-to',
    )} ${this.timezoneSrvc.formatTzDate(ts.to)}`;
    this.la.announce(message);
    this.applyTimespan(ts);
  }

  /**
   * Sets the timespan without announcing it. Only for changes nobody asked for -
   * the one on startup would otherwise be the first thing said after the page
   * title, on every load. A timespan moved for being too old comes with its own
   * important message.
   */
  private applyTimespan(ts: Timespan) {
    this._timespan = ts;
    this.timespanChanged.emit(ts);
    this.timeSrvc.saveTimespan(TIME_CACHE_PARAM, this._timespan);
  }

  getDatasetCount(): number {
    return this._datasets().length;
  }

  hasDatasets(): boolean {
    return this._datasets().length > 0;
  }

  hasDataset(id: string): boolean {
    return this.getDatasetEntryIndex(id) >= 0;
  }

  startLoadingDataset(id: string): void {
    this.storageSrvc.saveDataset(id);
    this._datasets.set([...this._datasets(), new LoadingDataset(id)]);
  }

  stopLoadingDatasetOnError(id: string) {
    const datasetIdx = this.getDatasetEntryIndex(id);
    this._datasets.update((ds) => ds.toSpliced(datasetIdx, 1));
    this.storageSrvc.removeDataset(id);
  }

  addOrUpdateDataset(dataset: SeriesGraphDataset) {
    const datasetIdx = this.getDatasetEntryIndex(dataset.id);
    const overviewDs = dataset.clone();
    overviewDs.children.forEach((c) => overviewDs.removeChild(c));
    if (this.visibilityLimitReached()) {
      dataset.setVisible(false, false);
    }
    dataset.stateChangeEvent.subscribe((state) => {
      overviewDs.setSelected(dataset.selected, false);
      overviewDs.setStyle(dataset.style.clone());
      this.validateVisibleCounter();
    });
    if (datasetIdx >= 0) {
      this._datasets.update((ds) => ds.with(datasetIdx, dataset));
      this.overviewDatasets.update((ds) => {
        ds[datasetIdx] = overviewDs;
        return [...ds];
      });
      this.storageSrvc.saveDataset(dataset.id);
    } else {
      this._datasets.set([...this._datasets(), dataset]);
      this.overviewDatasets.set([...this.overviewDatasets(), overviewDs]);
      this.storageSrvc.saveDataset(dataset.id);
      this.datasetAdded.next(dataset.id);
    }
    this.validateVisibleCounter();
  }

  validateVisibleCounter() {
    const count = this._datasets().filter(
      (ds) => ds instanceof SeriesGraphDataset && ds.visible,
    ).length;
    this.visibleDatasetCount.set(count);
  }

  setDataLoading(id: string, loading: boolean, visible: boolean) {
    const idx = this.getDatasetEntryIndex(id);
    const item = this._datasets()[idx];
    this._datasets.update((ds) =>
      ds.with(idx, item.clone({ dataLoading: loading })),
    );
    const set = visible
      ? this._loadingVisibleData
      : this._loadingBackgroundData;
    const emitter = visible
      ? this.loadingVisibleDataStatus
      : this.loadingBackgroundDataStatus;
    if (loading) {
      set.add(id);
      emitter.next(true);
    } else {
      set.delete(id);
      if (set.size == 0) {
        emitter.next(false);
      }
    }
  }

  setOverviewDataLoading(id: string, loading: boolean) {
    const idx = this.getOverviewDatasetEntryIndex(id);
    const item = this.overviewDatasets()[idx].clone();
    item.setDataLoading(loading);
    this.overviewDatasets.update((ds) => ds.with(idx, item));
    if (loading) {
      this._loadingOverviewData.add(id);
      this.loadingOverviewDataStatus.next(true);
    } else {
      this._loadingOverviewData.delete(id);
      if (this._loadingOverviewData.size == 0) {
        this.loadingOverviewDataStatus.next(false);
      }
    }
  }

  deleteDataset(id: string, notify: boolean) {
    const idx = this.getDatasetEntryIndex(id);
    if (idx == -1) {
      return;
    }

    if (notify) {
      this.notifier.notify(
        this.translate.instant('events.remove-timeseries') +
          this.describeDataset(this._datasets()[idx]),
      );
    }
    this._datasets.update((ds) => ds.toSpliced(idx, 1));
    this.storageSrvc.removeDataset(id);
    this.datasetRemoved.next(id);

    const ovDataset = this.getOverviewDatasetEntry(id);
    ovDataset.deleted();
    this.overviewDatasets.update((ds) => ds.toSpliced(idx, 1));
    this.validateVisibleCounter();
  }

  deleteAllDatasets(quiet?: boolean) {
    this._datasets()
      .map((e) => e.id)
      .forEach((id) => this.deleteDataset(id, false));
    if (!quiet) {
      this.notifier.notify(
        this.translate.instant('events.all-timeseries-removed'),
      );
    }
  }

  datasetsSelected(): boolean {
    return this._datasets().some(
      (e) => e instanceof SeriesGraphDataset && e.selected,
    );
  }

  clearSelections() {
    this._datasets().forEach(
      (e) => e instanceof SeriesGraphDataset && e.setSelected(false),
    );
  }

  initTimespan(timespan?: Timespan) {
    if (timespan) {
      this.applyTimespan(this.validateTimespan(timespan));
    } else {
      const localStoreTimespan = this.timeSrvc.loadTimespan(TIME_CACHE_PARAM);
      if (localStoreTimespan) {
        this.applyTimespan(this.validateTimespan(localStoreTimespan));
      } else {
        this.applyTimespan(
          this.timeSrvc.createByDurationWithEnd(
            moment.duration(1, 'days'),
            new Date(),
            'day',
          ),
        );
      }
    }
  }

  private validateTimespan(timespan: Timespan): Timespan {
    const daysForOldTimespanCheck =
      this.configSrvc.configuration.daysForOldTimespanCheck;
    if (!isNaN(daysForOldTimespanCheck)) {
      const old = moment()
        .subtract(daysForOldTimespanCheck, 'days')
        .startOf('day')
        .toDate()
        .getTime();
      const current = timespan.to > old;
      if (!current) {
        const message = this.translate.instant('events.timespan-to-old');
        // the application moves the timespan on its own; whoever misses the
        // reason cannot make sense of the view. stays put (WCAG 2.2.1)
        this.notifier.notify(message, { kind: 'important' });
        const diff = timespan.to - timespan.from;
        if (diff < 2 * 60 * 60 * 1000) {
          // timespan smaller 2 hours, then show at least 2 hours
          return this.timeSrvc.generateTimespan({ hours: 2 }, 'end');
        } else {
          return this.timeSrvc.generateTimespan({ milliseconds: diff }, 'end');
        }
      }
    }
    return timespan;
  }

  /**
   * Suffix for notifications: ": phenomenon @ station". The internal id is not
   * usable for that - it is a full service url.
   */
  private describeDataset(entry: SeriesGraphDataset | LoadingDataset): string {
    if (!(entry instanceof SeriesGraphDataset)) {
      return '';
    }
    const { phenomenonLabel, platformLabel } = entry.description;
    if (!phenomenonLabel) {
      return '';
    }
    return platformLabel
      ? `: ${phenomenonLabel} @ ${platformLabel}`
      : `: ${phenomenonLabel}`;
  }

  private getDatasetEntryIndex(id: string): number {
    return this._datasets().findIndex((e) => e.id === id);
  }

  private getOverviewDatasetEntryIndex(id: string): number {
    return this.overviewDatasets().findIndex(
      (e) => e !== undefined && e.id === id,
    );
  }

  getDatasetEntry(dsId: string): SeriesGraphDataset {
    const dataset = this._datasets().find((e) => e.id === dsId);
    if (dataset instanceof SeriesGraphDataset) return dataset;
    throw new Error(`No dataset found for ${dsId}`);
  }

  getOverviewDatasetEntry(dsId: string): SeriesGraphDataset {
    const dataset = this.overviewDatasets().find(
      (e) => e !== undefined && e.id === dsId,
    );
    if (dataset) return dataset;
    throw new Error(`No dataset found for ${dsId}`);
  }

  // Helper to allow external components to trigger a refresh/redraw of the graph
  // after they mutated the object in-place
  refreshDiagram(dsId: string, updateOverview: boolean = false) {
    const mutatedIndex = this.getDatasetEntryIndex(dsId);
    this._datasets.update((ds) =>
      ds.with(mutatedIndex, ds.at(mutatedIndex)!.clone()),
    );

    const mutated = this.getDatasetEntry(dsId);
    if (updateOverview) {
      // We might also want to redraw the overview
      // We ignore visible and selected, but need to manually copy styles
      const mutatedOverviewIndex = this.getOverviewDatasetEntryIndex(dsId);
      this.overviewDatasets.update((ds) => {
        const overview = ds.at(mutatedOverviewIndex)!.clone();
        overview.setStyle(mutated.style);
        return ds.with(mutatedOverviewIndex, overview);
      });
    }
    this.validateVisibleCounter();

    this.datasetStateChanged.next(mutated);
  }

  updateOverviewDatasetWithData(dsId: string, dataset: SeriesGraphDataset) {
    const idx = this.getOverviewDatasetEntryIndex(dsId);
    this.overviewDatasets.update((ds) => ds.with(idx, dataset));
  }

  updateDatasetWithData(dsId: string, dataset: SeriesGraphDataset) {
    const idx = this.getDatasetEntryIndex(dsId);
    this._datasets.update((ds) => ds.with(idx, dataset));
  }
}
