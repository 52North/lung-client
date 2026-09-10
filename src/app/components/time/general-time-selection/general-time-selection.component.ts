import {
  Component,
  inject,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import {
  ReactiveFormsModule,
  UntypedFormControl,
  UntypedFormGroup,
} from '@angular/forms';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDatepickerModule,
  MatDateRangePicker,
} from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  DefinedTimespan,
  DefinedTimespanService,
  HelgolandCoreModule,
  Time,
  Timespan,
} from '@helgoland/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { NotifierService } from '../../../services/notifier.service';

@Component({
  selector: 'helgoland-general-time-selection',
  templateUrl: './general-time-selection.component.html',
  styleUrls: ['./general-time-selection.component.scss'],
  imports: [
    HelgolandCoreModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatMenuModule,
    MatMomentDateModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class GeneralTimeSelectionComponent implements OnDestroy {
  protected timeSrvc = inject(Time);
  protected definedTimeSrvc = inject(DefinedTimespanService);
  private notifier = inject(NotifierService);
  private translate = inject(TranslateService);

  LASTHOUR = DefinedTimespan.LASTHOUR;
  TODAY = DefinedTimespan.TODAY;
  YESTERDAY = DefinedTimespan.YESTERDAY;
  TODAY_YESTERDAY = DefinedTimespan.TODAY_YESTERDAY;
  CURRENT_WEEK = DefinedTimespan.CURRENT_WEEK;
  LAST_WEEK = DefinedTimespan.LAST_WEEK;
  CURRENT_MONTH = DefinedTimespan.CURRENT_MONTH;
  LAST_MONTH = DefinedTimespan.LAST_MONTH;
  CURRENT_YEAR = DefinedTimespan.CURRENT_YEAR;
  LAST_YEAR = DefinedTimespan.LAST_YEAR;
  LAST_10_YEARS = DefinedTimespan.LAST_10_YEARS;
  LAST_20_YEARS = DefinedTimespan.LAST_20_YEARS;
  LAST_100_YEARS = DefinedTimespan.LAST_100_YEARS;

  range: UntypedFormGroup = new UntypedFormGroup({
    start: new UntypedFormControl(),
    end: new UntypedFormControl(),
  });

  private pickerClosed?: Subscription;

  readonly trigger = viewChild(MatMenuTrigger);

  readonly timespan = input.required<Timespan>();

  readonly timespanChanged = output<Timespan>();

  back() {
    this.timespanChanged.emit(this.timeSrvc.stepBack(this.timespan()!));
  }

  forward() {
    this.timespanChanged.emit(this.timeSrvc.stepForward(this.timespan()!));
  }

  predefinedRange(defined: DefinedTimespan) {
    const timespan = this.definedTimeSrvc.getInterval(defined);
    if (timespan) {
      this.timespanChanged.emit(timespan);
    }
  }

  onMenuOpen(picker: MatDateRangePicker<Date>) {
    this.range.setValue({
      start: new Date(this.timespan()!.from),
      end: new Date(this.timespan()!.to),
    });
    if (!this.pickerClosed) {
      this.pickerClosed = picker.closedStream.subscribe(() =>
        this.applyRange(),
      );
    }
  }

  private applyRange() {
    const { start, end } = this.range.value;
    if (!start || !end) {
      this.notifier.notify(
        this.translate.instant('time-selection.incomplete-range'),
        { kind: 'important' },
      );
      this.trigger()!.closeMenu();
      return;
    }
    this.timespanChanged.emit(new Timespan(start.toDate(), end.toDate()));
    this.trigger()!.closeMenu();
  }

  ngOnDestroy() {
    this.pickerClosed?.unsubscribe();
  }
}
