import {
  DatasetFilter,
  DatastreamExpandParams,
  DatastreamSelectParams,
  FirstLastValue,
  HELGOLAND_SERVICE_CONNECTOR_HANDLER,
  HelgolandData,
  HelgolandDataFilter,
  HelgolandDataset,
  HelgolandTimeseries,
  HelgolandTimeseriesData,
  InternalDatasetId,
  Observation,
  ReferenceValue,
  StaApiV1Connector,
  StaFilter,
  Timespan,
  TimeValueTuple,
} from '@helgoland/core';
import { forkJoin, map, mergeMap, Observable, of, throwError } from 'rxjs';

interface StaRefValue {
  label: string;
  lastValue: {
    value: number;
    timestamp: string;
  };
  referenceValueId: string;
}

export class LungStaApiConnector extends StaApiV1Connector {
  override name = 'LungStaApiConnector';

  override getDataset(
    internalId: InternalDatasetId,
    filter: DatasetFilter,
  ): Observable<HelgolandDataset> {
    if (this.filterTimeseriesMatchesNot(filter)) {
      return throwError(() => new Error('Could not create dataset'));
    }
    const firstFilter: StaFilter<
      DatastreamSelectParams,
      DatastreamExpandParams
    > = {
      $expand:
        'Thing,Thing/Locations,ObservedProperty,Sensor,Observations($orderby=phenomenonTime;$top=1)',
    };
    const lastFilter: StaFilter<
      DatastreamSelectParams,
      DatastreamExpandParams
    > = {
      $expand:
        'Thing,Thing/Locations,ObservedProperty,Sensor,Observations($orderby=phenomenonTime desc;$top=1)',
      $select: { Observations: true, id: true },
    };
    const firstRequest = this.sta.getDatastream(
      internalId.url,
      internalId.id,
      firstFilter,
    );
    const lastRequest = this.sta.getDatastream(
      internalId.url,
      internalId.id,
      lastFilter,
    );
    return forkJoin({ first: firstRequest, last: lastRequest }).pipe(
      mergeMap((res) => {
        const first = this.getFirstLast(res.first.Observations);
        const last = this.getFirstLast(res.last.Observations);
        const refValues: StaRefValue[] =
          res.first.properties?.['referenceValues'];
        if (refValues && refValues.length > 0) {
          const refs = refValues.map((ref) => {
            const last = new FirstLastValue(
              new Date(ref.lastValue.timestamp).getTime(),
              ref.lastValue.value,
            );
            return new ReferenceValue(ref.referenceValueId, ref.label, last);
          });
          return of(
            this.createExpandedTimeseries(
              res.first,
              first,
              last,
              refs,
              internalId.url,
            ),
          );
        } else {
          return of(
            this.createExpandedTimeseries(
              res.first,
              first,
              last,
              [],
              internalId.url,
            ),
          );
        }
      }),
    );
  }

  override getDatasetData(
    dataset: HelgolandTimeseries,
    timespan: Timespan,
    filter: HelgolandDataFilter,
  ): Observable<HelgolandData> {
    return super.getDatasetData(dataset, timespan, filter).pipe(
      map((data) => {
        if (data instanceof HelgolandTimeseriesData) {
          data.referenceValues = {};
          dataset.referenceValues.forEach((ref) => {
            const val = ref.lastValue?.value;
            if (val !== undefined) {
              data.referenceValues[ref.referenceValueId] = {
                values: [
                  [timespan.from, { value: val }],
                  [timespan.to, { value: val }],
                ],
              };
            }
          });
        }
        return data;
      }),
    );
  }

  protected createTimeValueTuple(
    observations: Observation[],
  ): TimeValueTuple[] {
    return observations
      .filter((obs) => obs.phenomenonTime)
      .map(
        (obs) =>
          [
            new Date(obs.phenomenonTime!).getTime(),
            { value: parseFloat(obs.result as string) },
          ] as TimeValueTuple,
      );
  }
}

export const LungStaApiConnectorProvider = {
  provide: HELGOLAND_SERVICE_CONNECTOR_HANDLER,
  useClass: LungStaApiConnector,
  multi: true,
};
