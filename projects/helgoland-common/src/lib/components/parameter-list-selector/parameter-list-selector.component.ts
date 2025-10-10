import { Component, inject, input, OnInit, output, viewChild } from '@angular/core';
import {
  MatListModule,
  MatSelectionList,
  MatSelectionListChange,
} from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ObservedProperty, Phenomenon, StaInterfaceService } from '@helgoland/core';
import { LabelMapperComponent } from '@helgoland/depiction';
import { FilteredParameter } from '@helgoland/selector';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationService } from 'projects/helgoland-timeseries/src/app/services/configuration.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'helgoland-common-parameter-list-selector',
  templateUrl: './parameter-list-selector.component.html',
  styleUrls: ['./parameter-list-selector.component.scss'],
  imports: [MatInputModule, MatFormFieldModule, LabelMapperComponent, MatListModule, MatProgressBarModule, TranslateModule],
})
export class ParameterListSelectorComponent implements OnInit {
  readonly list = viewChild(MatSelectionList);
  private staSrvc = inject(StaInterfaceService);
  private configSrvc = inject(ConfigurationService);
  // private idHandler = inject(InternalIdHandler);
  private staUrl = this.configSrvc.configuration.defaultService.apiUrl;

  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  readonly onItemSelected = output<Phenomenon>();
  readonly selectAllPhenomena = output();
  readonly selected = input<string>();

  filteredItems: ObservedProperty[] | undefined;
  items: ObservedProperty[] = []
  loading = 1;

  ngOnInit() {
    this.selectAllPhenomena.emit();
    this.loadItems();
  }
  
  protected onInput(event: Event) {
    const value = ((event.target as HTMLInputElement).value);
    this.filteredItems = this._filter(value);
  }

  private _filter(value: string): ObservedProperty[] {
    const filterValue = this._normalizeValue(value);
    return this.items.filter(item => {
      return this._normalizeValue((item.name || "") + (item.description || "")).includes(filterValue);
    });
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  protected loadItems() {
    this.staSrvc.getObservedProperties(this.staUrl, { $select: "id,name,description", $top: 1000 })
      .subscribe({
        next: (res) => {
          this.items = res.value;
          this.filteredItems = this.items.sort((a,b) => a.name! < b.name! ? -1 : 1);
          this.loading = 0;
        },
        error: (error) => console.log(error),
      })
  }

  onSelectItem(item: FilteredParameter): void {
    this.onItemSelected.emit(item);
  }

  selectionChanged(selection: MatSelectionListChange) {
    const match = this.items.find((e) => e['name'] === selection.options[0].value);
    if (match) {
      this.onItemSelected.emit({ id: match['@iot.id'], label: match.name || "" });
    }
  }
}
