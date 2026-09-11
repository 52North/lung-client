import {
  computed,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  DatasetType,
  HelgolandParameterFilter,
  Phenomenon,
} from '@helgoland/core';
import { SelectedDataSourceService } from '../../services/selected-data-source.service';

/** The part of the map selection a share link can carry. */
export interface MapSelectionState {
  phenomenonId?: string;
  searchTerm?: string;
  showActiveOnly?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MapSelectionStateService {
  private selectedDataSourceSrvc = inject(SelectedDataSourceService);

  selectedPhenomenonId: WritableSignal<string | undefined> = signal(undefined);

  private _searchTerm = signal('');

  // The station whose dataset dialog is currently open. There is no other
  // notion of a selected station in this app, and a share link needs it.
  private _currentStationId = signal<string | undefined>(undefined);

  private _showActiveOnly = signal(true);

  get searchTerm() {
    return this._searchTerm.asReadonly();
  }

  setSearchTerm(value: string) {
    this._searchTerm.set(value);
  }

  get currentStationId() {
    return this._currentStationId.asReadonly();
  }

  setCurrentStationId(id: string | undefined) {
    this._currentStationId.set(id);
  }

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

  /**
   * The state a freshly entered map view starts from. Used to be the
   * `selectAllPhenomena` emit in `ParameterListSelectorComponent.ngOnInit`,
   * which ran after a share link had already been applied and silently undid it.
   */
  resetSelection() {
    this.selectedPhenomenonId.set(undefined);
    this._searchTerm.set('');
    this._currentStationId.set(undefined);
  }

  /**
   * Applies a shared link. Writes the signals directly instead of going through
   * the setters, so the result does not depend on the order of the assignments.
   */
  restoreState(state: MapSelectionState) {
    if (state.phenomenonId !== undefined) {
      this.selectedPhenomenonId.set(state.phenomenonId);
    }
    if (state.searchTerm !== undefined) {
      this._searchTerm.set(state.searchTerm);
    }
    if (state.showActiveOnly !== undefined) {
      this._showActiveOnly.set(state.showActiveOnly);
    }
  }
}
