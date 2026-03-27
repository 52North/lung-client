import { Component, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  BlacklistedService,
  DatasetApi,
  HelgolandParameterFilter,
  HelgolandService,
} from '@helgoland/core';
import {
  HelgolandSelectorModule,
  ServiceSelectorService,
} from '@helgoland/selector';
import { TranslateModule } from '@ngx-translate/core';

interface ExtendedHelgolandService extends HelgolandService {
  protected?: boolean;
}
@Component({
  selector: 'helgoland-common-service-list-selector',
  templateUrl: './service-list-selector.component.html',
  styleUrls: ['./service-list-selector.component.scss'],
  imports: [
    HelgolandSelectorModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    TranslateModule,
  ],
})
export class ServiceListSelectorComponent {
  protected serviceSelectorService = inject(ServiceSelectorService);

  readonly datasetApiList = input<DatasetApi[]>([]);

  readonly providerBlacklist = input<BlacklistedService[]>([]);

  readonly supportStations = input<boolean>(); // TODO: needed???

  readonly selectedService = input<HelgolandService>();

  readonly filter = input<HelgolandParameterFilter>({});

  readonly showUnresolvableServices = input<boolean>();

  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  readonly onServiceSelected = output<HelgolandService>();

  services = signal<ExtendedHelgolandService[]>([]);
  unResolvableServices = signal<DatasetApi[]>([]);
  loadingCount = signal(0);

  ngOnInit() {
    const datasetApiList = this.datasetApiList();
    if (datasetApiList) {
      this.loadingCount.set(datasetApiList.length);
      this.services.set([]);
      this.unResolvableServices.set([]);
      datasetApiList.forEach((api) => {
        this.serviceSelectorService
          .fetchServicesOfAPI(api.url, this.providerBlacklist(), this.filter())
          .subscribe({
            next: (res) => {
              this.loadingCount.update((c) => c - 1);
              if (res && res instanceof Array) {
                res.forEach((entry) => {
                  const filter = this.filter();
                  if (
                    entry.quantities?.datasets ||
                    (filter && !filter.expanded)
                  ) {
                    this.services.update((s) => [...s, entry]);
                  }
                });
              } else {
                this.services.update((s) => [
                  ...s,
                  {
                    apiUrl: api.url,
                    label: api.name,
                    protected: true,
                    id: api.url,
                    type: '',
                    version: '',
                  },
                ]);
              }
            },
            error: () => {
              this.unResolvableServices.update((s) => [...s, api]);
              this.loadingCount.update((c) => c - 1);
            },
          });
      });
    }
  }

  isSelected(service: HelgolandService) {
    const selectedService = this.selectedService();
    if (!selectedService) {
      return false;
    }
    return (
      selectedService.id === service.id &&
      selectedService.apiUrl === service.apiUrl
    );
  }

  selectService(service: HelgolandService) {
    this.onServiceSelected.emit(service);
  }
}
