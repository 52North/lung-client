import { computed, Injectable, signal, WritableSignal } from '@angular/core';
import {
  DatasetType,
  HelgolandParameterFilter,
  HelgolandService,
  Phenomenon,
} from '@helgoland/core';

@Injectable({
  providedIn: 'root',
})
export class MapSelectionStateService {
  selectedService: WritableSignal<HelgolandService | undefined> = signal(undefined);

  selectedPhenomenonId: WritableSignal<string | undefined> = signal(undefined);

  private _showActiveOnly = signal(true);

  get showActiveOnly() {
    return this._showActiveOnly.asReadonly();
  }

  setShowActiveOnly(value: boolean) {
    this._showActiveOnly.set(value);
  }

  stationFilter = computed<HelgolandParameterFilter | undefined>(() => {
    const service = this.selectedService();
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
