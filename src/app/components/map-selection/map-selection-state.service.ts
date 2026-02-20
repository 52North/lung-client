import { Injectable, signal } from '@angular/core';
import { HelgolandService } from '@helgoland/core';

@Injectable({
  providedIn: 'root',
})
export class MapSelectionStateService {
  selectedService?: HelgolandService;

  selectedPhenomenonId?: string;

  private _showActiveOnly = signal(true);

  get showActiveOnly() {
    return this._showActiveOnly.asReadonly();
  }

  setShowActiveOnly(value: boolean) {
    this._showActiveOnly.set(value);
  }
}
