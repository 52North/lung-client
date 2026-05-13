import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { DataTableComponent } from '../../components/data-table/data-table.component';
import { GeneralTimeSelectionComponent } from '../../components/time/general-time-selection/general-time-selection.component';
import { DatasetsService } from '../../services/graph-datasets.service';
import { D3SeriesGraphOptions, HelgolandD3Module, HoveringStyle } from '@helgoland/d3';

@Component({
  selector: 'helgoland-table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [DataTableComponent, HelgolandD3Module, GeneralTimeSelectionComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableViewComponent {
  protected graphDatasetsSrvc = inject(DatasetsService);

  overviewOptions: D3SeriesGraphOptions = {
    showTimeLabel: false,
    yaxis: false,
    hoverStyle: HoveringStyle.none,
    overview: true,
  };

}
