import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { HelgolandService } from '@helgoland/core';
import { TranslateModule } from '@ngx-translate/core';
import { ChangeDataSourceModalComponent } from './change-data-source-modal/change-data-source-modal.component';

export interface ChangeDataSourceProps {
  selectedDatasetSrvc?: HelgolandService;
}

@Component({
  selector: 'app-change-data-source',
  templateUrl: './change-data-source.component.html',
  styleUrls: ['./change-data-source.component.scss'],
  imports: [TranslateModule, MatButtonModule],
})
export class ChangeDataSourceComponent {
  private dialog = inject(MatDialog);
  constructor() {}

  openModal() {
    const conf: ChangeDataSourceProps = {
      selectedDatasetSrvc: undefined,
    };
    const dialogRef = this.dialog.open(ChangeDataSourceModalComponent, {
      data: conf,
    });
    dialogRef.afterClosed().subscribe((props: ChangeDataSourceProps) => {
      // debugger;
      if (props) {
        // TODO: define output to set new data source
      }
    });
  }
}
