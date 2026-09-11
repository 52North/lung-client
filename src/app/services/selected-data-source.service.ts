import { inject, Injectable, signal } from '@angular/core';
import {
  DatasetApi,
  HelgolandService,
  HelgolandServicesConnector,
} from '@helgoland/core';

import { ConfigurationService } from './configuration.service';

@Injectable({ providedIn: 'root' })
export class SelectedDataSourceService {
  private configSrvc = inject(ConfigurationService);
  private serviceConnector = inject(HelgolandServicesConnector);

  readonly selectedService = signal<HelgolandService | undefined>(undefined);

  // The default service is fetched asynchronously in the constructor. Whoever
  // picks a source in the meantime - the user through the dialog, or a share
  // link - would silently lose it again once that request comes back.
  private explicitSelection = false;

  constructor() {
    const defaultService = this.configSrvc.configuration?.defaultService;
    if (defaultService?.apiUrl) {
      this.serviceConnector
        .getServices(defaultService.apiUrl)
        .subscribe((services) => {
          if (this.explicitSelection) {
            return;
          }
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
    this.explicitSelection = true;
    this.selectedService.set(srvc);
  }

  /**
   * Selects a service that is only known by id and api url, as it arrives from
   * a share link. Returns false when the url is not one of the configured apis,
   * in which case nothing happens and the default source stays in place.
   */
  selectById(apiUrl: string, serviceId: string): boolean {
    if (!this.isAllowedApiUrl(apiUrl)) {
      return false;
    }
    this.explicitSelection = true;
    this.serviceConnector.getService(serviceId, apiUrl).subscribe({
      next: (srvc) => {
        if (srvc) {
          this.selectedService.set(srvc);
        } else {
          this.explicitSelection = false;
        }
      },
      error: () => (this.explicitSelection = false),
    });
    return true;
  }

  /**
   * A url out of a shared link must never be requested unchecked - otherwise the
   * app would fetch its data from whatever host the link names.
   */
  private isAllowedApiUrl(apiUrl: string): boolean {
    const config = this.configSrvc.configuration;
    const allowed = [
      ...(config?.datasetApis?.map((api: DatasetApi) => api.url) ?? []),
      config?.defaultService?.apiUrl,
    ];
    const normalize = (url: string | undefined) => url?.replace(/\/+$/, '');
    return allowed.some(
      (candidate) =>
        candidate !== undefined && normalize(candidate) === normalize(apiUrl),
    );
  }
}
