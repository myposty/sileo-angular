import {
  Component,
  inject,
  input,
  computed,
  signal,
  effect,
  OnDestroy,
} from '@angular/core';
import { Sileo } from '../services/sileo.service';
import { ToastComponent } from './toast.component';
import { ToastItem, ToastPosition, THEME_FILLS } from '../models/toast.model';

function pillAlign(pos: string): string {
  if (pos.includes('right')) return 'right';
  if (pos.includes('center')) return 'center';
  return 'left';
}

function expandDir(pos: string): string {
  return pos.startsWith('top') ? 'bottom' : 'top';
}

@Component({
  selector: 'sileo-toaster',
  standalone: true,
  imports: [ToastComponent],
  template: `
    <ng-content />
    @for (entry of activePositions(); track entry.position) {
      <section
        data-sileo-viewport
        [attr.data-position]="entry.position"
        [attr.data-theme]="resolvedTheme()"
        aria-live="polite"
        [style]="getViewportStyle(entry.position)"
      >
        @for (item of entry.toasts; track item.id) {
          <sileo-toast
            [toast]="item"
            [pillAlign]="pillAlignFor(entry.position)"
            [expandDir]="expandDirFor(entry.position)"
            [canExpand]="activeId() === undefined || activeId() === item.id"
            [refreshKey]="item.instanceId"
            (mouseEntered)="onToastEnter(item.id, $event)"
            (mouseLeft)="onToastLeave($event)"
            (dismissed)="sileo.dismiss(item.id)"
          />
        }
      </section>
    }
  `,
})
export class SileoToaster implements OnDestroy {
  readonly sileo = inject(Sileo);

  readonly position = input<ToastPosition>('top-right');
  readonly theme = input<'light' | 'dark' | 'system' | undefined>(undefined);
  readonly offset = input<number | { top?: number; right?: number; bottom?: number; left?: number } | undefined>(undefined);
  readonly options = input<any>(undefined);

  readonly activeId = signal<string | undefined>(undefined);
  private hovered = false;

  readonly resolvedTheme = signal<string | undefined>(undefined);

  private fillCache = new Map<string, ToastItem>();

  readonly activePositions = computed(() => {
    const toasts = this.sileo.toasts();
    const defaultPos = this.position();
    const theme = this.theme();
    const resolved = this.resolvedTheme();
    const map = new Map<string, ToastItem[]>();

    for (const t of toasts) {
      let item = t;
      if (!t.fill && theme && resolved) {
        const cacheKey = `${t.id}:${t.instanceId}:${t.exiting}`;
        const cached = this.fillCache.get(cacheKey);
        if (cached && cached.id === t.id && cached.instanceId === t.instanceId && cached.exiting === t.exiting) {
          item = cached;
        } else {
          item = { ...t, fill: THEME_FILLS[resolved] };
          this.fillCache.set(cacheKey, item);
        }
      }
      const pos = item.position ?? defaultPos;
      const arr = map.get(pos);
      if (arr) arr.push(item);
      else map.set(pos, [item]);
    }

    // Clean stale cache entries
    const ids = new Set(toasts.map(t => `${t.id}:${t.instanceId}:${t.exiting}`));
    for (const key of this.fillCache.keys()) {
      if (!ids.has(key)) this.fillCache.delete(key);
    }

    return Array.from(map.entries()).map(([position, toasts]) => ({ position, toasts }));
  });

  private handlersCache = new Map<string, {
    enter: (e: MouseEvent) => void;
    leave: (e: MouseEvent) => void;
    dismiss: () => void;
  }>();

  private mqListener: (() => void) | null = null;

  constructor() {
    // Sync position & options to service
    effect(() => {
      this.sileo.position = this.position();
      this.sileo.globalOptions = this.options();
    });

    // Resolve theme
    effect(() => {
      const theme = this.theme();
      if (!theme) {
        this.resolvedTheme.set(undefined);
        this._cleanupMq();
        return;
      }
      if (theme === 'light' || theme === 'dark') {
        this.resolvedTheme.set(theme);
        this._cleanupMq();
        return;
      }
      // system
      if (typeof window === 'undefined') {
        this.resolvedTheme.set('light');
        return;
      }
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      this.resolvedTheme.set(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => this.resolvedTheme.set(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      this._cleanupMq();
      this.mqListener = () => mq.removeEventListener('change', handler);
    }, { allowSignalWrites: true });

    // Track latest active toast
    effect(() => {
      const toasts = this.sileo.toasts();
      for (let i = toasts.length - 1; i >= 0; i--) {
        if (!toasts[i].exiting) {
          this.activeId.set(toasts[i].id);
          return;
        }
      }
      this.activeId.set(undefined);
    }, { allowSignalWrites: true });

    // Schedule timers and prune stale ones
    effect(() => {
      const toasts = this.sileo.toasts();
      this.sileo.pruneTimers(toasts);
      const ids = new Set(toasts.map(t => t.id));
      for (const id of this.handlersCache.keys()) {
        if (!ids.has(id)) this.handlersCache.delete(id);
      }
      this.sileo.scheduleTimers(toasts, this.hovered);
    });
  }

  ngOnDestroy(): void {
    this._cleanupMq();
    this.sileo.clearAllTimersForHover();
  }

  private _cleanupMq(): void {
    if (this.mqListener) {
      this.mqListener();
      this.mqListener = null;
    }
  }

  pillAlignFor(pos: string): string {
    return pillAlign(pos);
  }

  expandDirFor(pos: string): string {
    return expandDir(pos);
  }

  getViewportStyle(pos: string): Record<string, string> {
    const o = this.offset();
    if (o === undefined) return {};
    const offset = typeof o === 'number' ? { top: o, right: o, bottom: o, left: o } : o;
    const s: Record<string, string> = {};
    const px = (v?: number) => (v != null ? `${v}px` : '');
    if (pos.startsWith('top') && offset?.top) s['top'] = px(offset.top);
    if (pos.startsWith('bottom') && offset?.bottom) s['bottom'] = px(offset.bottom);
    if (pos.endsWith('left') && offset?.left) s['left'] = px(offset.left);
    if (pos.endsWith('right') && offset?.right) s['right'] = px(offset.right);
    return s;
  }

  onToastEnter(id: string, e: MouseEvent): void {
    this.activeId.set(id);
    if (!this.hovered) {
      this.hovered = true;
      this.sileo.clearAllTimersForHover();
    }
  }

  onToastLeave(e: MouseEvent): void {
    if (this.hovered) {
      this.hovered = false;
      this.sileo.scheduleTimers(this.sileo.toasts(), false);
    }
    // Reset activeId to latest
    const toasts = this.sileo.toasts();
    for (let i = toasts.length - 1; i >= 0; i--) {
      if (!toasts[i].exiting) {
        this.activeId.set(toasts[i].id);
        return;
      }
    }
    this.activeId.set(undefined);
  }
}
