import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';
import {
  DatasetType,
  HelgolandParameterFilter,
  Phenomenon
} from '@helgoland/core';
import { SelectedDataSourceService } from '../../services/selected-data-source.service';

@Injectable({
  providedIn: 'root',
})
export class MapSelectionStateService {
  private selectedDataSourceSrvc = inject(SelectedDataSourceService);

  selectedPhenomenonId: WritableSignal<string | undefined> = signal(undefined);

  private _showActiveOnly = signal(true);

  get showActiveOnly() {
    return this._showActiveOnly.asReadonly();
  }

  setShowActiveOnly(value: boolean) {
    this._showActiveOnly.set(value);
  }

  stationFilter = computed<HelgolandParameterFilter | undefined>(() => {
    const service = this.selectedDataSourceSrvc.selectedService();
    if (!service) return undefined;
    return {
      type: DatasetType.Timeseries,
      service: service.id,
      phenomenon: this.selectedPhenomenonId(),
    };
  });

  selectAllPhenomena() {
    this.selectedPhenomenonId.set(undefined);
  }

  onPhenomenonSelected(phenomenon: Phenomenon) {
    this.selectedPhenomenonId.set(phenomenon.id);
  }
}
