import { Component, output } from '@angular/core';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-string-filter',
  templateUrl: './string-filter.component.html',
  styleUrls: ['./string-filter.component.css'],
  imports: [MatFormField, TranslateModule, MatInputModule],
})
export class StringFilterComponent {
  readonly filter = output<string>();

  protected onInput(event: Event) {
    this.filter.emit((event.target as HTMLInputElement).value);
  }
}
