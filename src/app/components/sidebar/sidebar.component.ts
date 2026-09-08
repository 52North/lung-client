import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, HostBinding, inject, Input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export const SIDEBAR_OVERLAY_BREAKPOINT = '(max-width: 1024px)';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [MatIconModule, TranslateModule],
})
export class SidebarComponent {
  @Input() collapsible = true;
  @Input() position: 'left' | 'right' = 'left';
  @Input() handleTop: string = '50%';

  readonly collapsed = signal(false);

  @HostBinding('class.right') get isRight() {
    return this.position === 'right';
  }

  private breakpointObserver = inject(BreakpointObserver);

  constructor() {
    this.breakpointObserver
      .observe(SIDEBAR_OVERLAY_BREAKPOINT)
      .pipe(takeUntilDestroyed())
      .subscribe((state) => this.collapsed.set(state.matches));
  }
}
