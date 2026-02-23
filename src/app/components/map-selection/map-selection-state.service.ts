import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { HelgolandService } from '@helgoland/core';

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
}
