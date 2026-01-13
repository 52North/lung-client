import { Component, inject, input, OnInit, output, viewChild } from '@angular/core';
import { MatExpansionModule, MatExpansionPanel, MatExpansionPanelContent, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatListModule,
  MatSelectionList,
  MatSelectionListChange,
} from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ObservedProperty, Phenomenon, StaInterfaceService } from '@helgoland/core';
import { LabelMapperComponent } from '@helgoland/depiction';
import { FilteredParameter } from '@helgoland/selector';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationService } from '../../services/configuration.service';

@Component({
  selector: 'helgoland-common-parameter-list-selector',
  templateUrl: './parameter-list-selector.component.html',
  styleUrls: ['./parameter-list-selector.component.scss'],
  imports: [
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelContent,
    MatInputModule,
    MatFormFieldModule,
    LabelMapperComponent,
    MatListModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatTooltipModule,
    TranslateModule
  ],
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

  observedPropertyGroups: Map<string, ObservedProperty[]> = new Map();
  items: ObservedProperty[] = []
  loading = 1;

  ngOnInit() {
    this.selectAllPhenomena.emit();
    this.loadItems();
  }

  protected onInput(event: Event) {
    const value = ((event.target as HTMLInputElement).value);
    this.parseIntoGroups(value);
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  protected loadItems() {
    this.staSrvc.getObservedProperties(this.staUrl, { $select: "id,name,description,properties", $top: 10000 })
      .subscribe({
        next: (res) => {
          this.items = res.value;
          this.loading = 0;
          this.parseIntoGroups("")
        },
        error: (error) => console.log(error),
      })
  }

  private parseIntoGroups(filter: string) {
    const filterValue = this._normalizeValue(filter);
    const ALL_DATASTREAMS = "Alle Phänomene";

    const groups = new Map<string, Set<ObservedProperty>>(
      [[ALL_DATASTREAMS, new Set()]]
    );

    for (const item of this.items) {
      if (filterValue != "" && !(this._normalizeValue((item.name || "") + (item.description || "")).includes(filterValue))) {
        continue;
      }

      groups.get(ALL_DATASTREAMS)?.add(item);
      for (const group of item.properties?.["groups"] || []) {
        if (!groups.has(group)) {
          groups.set(group, new Set([item]));
        }
        groups.get(group)?.add(item);
      }
    }

    // sort alphabetically
    this.observedPropertyGroups.clear();  
    const sortedKeys = Array.from(groups.keys());
    for (const k of sortedKeys) {
      const entries = Array.from(groups.get(k)!);
      this.observedPropertyGroups.set(k, entries.sort((a, b) => a.name! < b.name! ? -1 : 1));
    }
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
