import { inject, Injectable, signal } from '@angular/core';
import { HelgolandService, HelgolandServicesConnector } from '@helgoland/core';

import { ConfigurationService } from './configuration.service';

@Injectable({ providedIn: 'root' })
export class SelectedDataSourceService {
  private configSrvc = inject(ConfigurationService);
  private serviceConnector = inject(HelgolandServicesConnector);

  readonly selectedService = signal<HelgolandService | undefined>(undefined);

  constructor() {
    const defaultService = this.configSrvc.configuration?.defaultService;
    if (defaultService?.apiUrl) {
      this.serviceConnector
        .getServices(defaultService.apiUrl)
        .subscribe((services) => {
          const match = services.find((s) => s.id === defaultService.serviceId);
          if (match) {
            this.selectedService.set(match);
          }
        });
    } else {
      console.info(
        'SelectedDataSourceService: Kein "defaultService" in der App-Config konfiguriert.',
      );
    }
  }

  select(srvc: HelgolandService): void {
    this.selectedService.set(srvc);
  }
}
