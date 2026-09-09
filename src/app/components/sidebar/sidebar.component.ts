import { A11yModule } from '@angular/cdk/a11y';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  Component,
  computed,
  ElementRef,
  HostBinding,
  inject,
  Input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export const SIDEBAR_OVERLAY_BREAKPOINT = '(max-width: 1024px)';

// Below this width the panel covers all but a sliver of the main area (320 px
// of 360 px on a phone), so an open sidebar has to behave like a dialog:
// keyboard focus stays inside it and Esc closes it. Between the two breakpoints
// it floats over the content but leaves enough of it visible and operable -
// trapping focus there would take away a working interaction, so it stays
// non-modal on purpose.
export const SIDEBAR_MODAL_BREAKPOINT = '(max-width: 600px)';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [A11yModule, MatIconModule, TranslateModule],
})
export class SidebarComponent {
  @Input() collapsible = true;
  @Input() position: 'left' | 'right' = 'left';
  @Input() handleTop: string = '50%';

  readonly collapsed = signal(false);

  private narrow = signal(false);

  /** An open panel on a viewport too narrow to show the content beside it. */
  protected modal = computed(() => this.narrow() && !this.collapsed());

  private handle = viewChild<ElementRef<HTMLElement>>('handle');

  @HostBinding('class.right') get isRight() {
    return this.position === 'right';
  }

  private breakpointObserver = inject(BreakpointObserver);

  constructor() {
    this.breakpointObserver
      .observe(SIDEBAR_OVERLAY_BREAKPOINT)
      .pipe(takeUntilDestroyed())
      .subscribe((state) => this.collapsed.set(state.matches));

    this.breakpointObserver
      .observe(SIDEBAR_MODAL_BREAKPOINT)
      .pipe(takeUntilDestroyed())
      .subscribe((state) => this.narrow.set(state.matches));
  }

  protected onKeydown(event: KeyboardEvent) {
    if (this.modal() && event.key === 'Escape') {
      // Do not let the key travel on and close a dialog underneath as well.
      event.stopPropagation();
      this.close();
    }
  }

  protected close() {
    this.collapsed.set(true);
    this.handle()?.nativeElement.focus();
  }
}
