import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  BlacklistedService,
  DatasetApi,
  DatasetType,
  HelgolandParameterFilter,
  HelgolandService,
} from '@helgoland/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationService } from '../../../services/configuration.service';
import { SelectedDataSourceService } from '../../../services/selected-data-source.service';
import { ServiceListSelectorComponent } from '../../service-list-selector/service-list-selector.component';

@Component({
  selector: 'app-change-data-source-modal',
  templateUrl: './change-data-source-modal.component.html',
  styleUrls: ['./change-data-source-modal.component.scss'],
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatSlideToggleModule,
    ServiceListSelectorComponent,
    TranslateModule,
  ],
})
export class ChangeDataSourceModalComponent {
  protected dialogRef =
    inject<MatDialogRef<ChangeDataSourceModalComponent>>(MatDialogRef);
  private configSrvc = inject(ConfigurationService);
  protected selectedDataSourceSrvc = inject(SelectedDataSourceService);

  protected filter: HelgolandParameterFilter = {
    type: DatasetType.Timeseries,
    expanded: true,
  };
  protected datasetApis: DatasetApi[];
  protected blacklist: BlacklistedService[];

  constructor() {
    this.datasetApis = this.configSrvc.configuration?.datasetApis || [];
    this.blacklist = this.configSrvc.configuration?.providerBlackList || [];
  }

  protected serviceSelected(srvc: HelgolandService) {
    this.selectedDataSourceSrvc.select(srvc);
  }
}
