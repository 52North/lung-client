import {
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  Signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import {
  MatExpansionModule,
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatListModule,
  MatSelectionList,
  MatSelectionListChange,
} from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ObservedProperty,
  Phenomenon,
  StaInterfaceService,
} from '@helgoland/core';
import { LabelMapperComponent } from '@helgoland/depiction';
import { FilteredParameter } from '@helgoland/selector';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationService } from '../../../services/configuration.service';

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
    TranslateModule,
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
  readonly showOnlyActive = input.required<boolean>();

  observedPropertyGroups: WritableSignal<Map<string, ObservedProperty[]>> = signal(new Map());
  items: WritableSignal<ObservedProperty[]> = signal([]);
  loading: WritableSignal<boolean> = signal(false);

  constructor() {
    effect(() => {
      this.showOnlyActive();
      this.loadItems();
    });
  }

  ngOnInit() {
    this.selectAllPhenomena.emit();
    this.loadItems();
  }

  protected onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.parseIntoGroups(value);
  }

  private _normalizeValue(value: string): string {
    return value.toLowerCase().replace(/\s/g, '');
  }

  protected loadItems() {
    this.loading.set(true);
    const filter = this.showOnlyActive()
      ? 'Datastreams/Thing/properties/active eq true'
      : undefined;
    this.staSrvc
      .getObservedProperties(this.staUrl, {
        $select: 'id,name,description,properties',
        $top: 10000,
        $filter: filter,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.value);
          this.parseIntoGroups('');
          this.loading.set(false);
        },
        error: (error) => console.log(error),
      });
  }

  private parseIntoGroups(filter: string) {
    const filterValue = this._normalizeValue(filter);
    const ALL_DATASTREAMS = 'Alle Phänomene';

    const groups = new Map<string, Set<ObservedProperty>>([
      [ALL_DATASTREAMS, new Set()],
    ]);

    for (const item of this.items()) {
      if (
        filterValue != '' &&
        !this._normalizeValue(
          (item.name || '') + (item.description || ''),
        ).includes(filterValue)
      ) {
        continue;
      }

      groups.get(ALL_DATASTREAMS)?.add(item);
      for (const group of item.properties?.['groups'] || []) {
        if (!groups.has(group)) {
          groups.set(group, new Set([item]));
        }
        groups.get(group)?.add(item);
      }
    }

    // sort alphabetically
    const sortedKeys = Array.from(groups.keys()).sort((a, b) =>
      a.toLowerCase() < b.toLowerCase() ? -1 : 1,
    );
    this.observedPropertyGroups.set(new Map());
    for (const k of sortedKeys) {
      const entries = Array.from(groups.get(k)!);
      this.observedPropertyGroups.update((original) => {
        return original.set(
          k,
          entries.sort((a, b) => (a.name! < b.name! ? -1 : 1)),
        );
      })
    }
  }

  onSelectItem(item: FilteredParameter): void {
    this.onItemSelected.emit(item);
  }

  selectionChanged(selection: MatSelectionListChange) {
    const match = this.items().find(
      (e) => e['name'] === selection.options[0].value,
    );
    if (match) {
      this.onItemSelected.emit({
        id: match['@iot.id'],
        label: match.name || '',
      });
    }
  }
}
