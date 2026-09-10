import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { NotificationComponent } from '../components/notification/notification.component';

/**
 * Kind of a message. It decides whether the message disappears on its own:
 *
 * - `confirmation` acknowledges a visible change ("timeseries removed"). The
 *   information is already in the changed state of the ui, so the message is
 *   allowed to be transient.
 * - `important` carries information that is nowhere else (errors, changes the
 *   application made on its own). It stays until it is dismissed - otherwise it
 *   would be a time limit on content that is meant to be read (WCAG 2.2.1).
 */
export type NotificationKind = 'confirmation' | 'important';

export interface NotifyOptions {
  kind?: NotificationKind;
}

interface NotificationEntry {
  id: number;
  text: string;
  kind: NotificationKind;
}

/** how long a confirmation stays - long enough to read a station name */
const CONFIRMATION_DURATION = 5000;

/** from this many messages on, further confirmations are only counted */
const MAX_VISIBLE = 5;

@Injectable({
  providedIn: 'root',
})
export class NotifierService {
  protected snackBar = inject(MatSnackBar);

  private entries: WritableSignal<NotificationEntry[]> = signal([]);
  private suppressedCount: WritableSignal<number> = signal(0);
  private snackBarRef?: MatSnackBarRef<NotificationComponent>;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;

  notify(message: string, options: NotifyOptions = {}): void {
    const kind = options.kind ?? 'confirmation';

    // important messages are never suppressed - they are the only place their
    // information exists
    if (kind === 'confirmation' && this.entries().length >= MAX_VISIBLE) {
      this.suppressedCount.update((count) => count + 1);
    } else {
      const entry: NotificationEntry = {
        id: this.nextId++,
        text: message,
        kind,
      };
      this.entries.update((entries) => [...entries, entry]);
      if (kind === 'confirmation') {
        this.timers.set(
          entry.id,
          setTimeout(() => this.dismissEntry(entry.id), CONFIRMATION_DURATION),
        );
      }
    }

    this.open();
  }

  /** hides one message; the last one closes the snack bar */
  dismissEntry(id: number): void {
    this.clearTimer(id);
    this.entries.update((entries) => entries.filter((e) => e.id !== id));
    if (this.entries().length === 0) {
      this.snackBarRef?.dismiss();
    }
  }

  private open(): void {
    if (this.snackBarRef) {
      return;
    }
    this.snackBarRef = this.snackBar.openFromComponent(NotificationComponent, {
      // the snack bar live region is the only source of announcements. the cdk
      // LiveAnnouncer does not work here: it reuses a single element, so a
      // concurrent announcement (the route title on startup, for instance)
      // overwrites the message before it is read
      politeness: 'polite',
      data: {
        entries: this.entries.asReadonly(),
        suppressed: this.suppressedCount.asReadonly(),
        dismiss: (id: number) => this.dismissEntry(id),
      },
    });
    this.snackBarRef.afterDismissed().subscribe(() => this.reset());
  }

  private reset(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.entries.set([]);
    this.suppressedCount.set(0);
    this.snackBarRef = undefined;
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
