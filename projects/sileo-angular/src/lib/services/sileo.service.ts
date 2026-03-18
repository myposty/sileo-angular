import { Injectable, signal } from '@angular/core';
import {
  ToastItem,
  ToastOptions,
  ToastPromiseOptions,
  ToastState,
  ToastPosition,
  DEFAULT_TOAST_DURATION,
  EXIT_DURATION,
  AUTO_EXPAND_DELAY,
  AUTO_COLLAPSE_DELAY,
} from '../models/toast.model';
import { Observable, firstValueFrom, isObservable } from 'rxjs';

let idCounter = 0;

function generateId(): string {
  return `${++idCounter}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function timeoutKey(t: ToastItem): string {
  return `${t.id}:${t.instanceId}`;
}

function resolveAutopilot(
  opts: ToastOptions,
  duration: number | null | undefined,
): { expandDelayMs?: number; collapseDelayMs?: number } {
  if (opts.autopilot === false || !duration || duration <= 0) return {};
  const cfg = typeof opts.autopilot === 'object' ? opts.autopilot : undefined;
  const clamp = (v: number) => Math.min(duration, Math.max(0, v));
  return {
    expandDelayMs: clamp(cfg?.expand ?? AUTO_EXPAND_DELAY),
    collapseDelayMs: clamp(cfg?.collapse ?? AUTO_COLLAPSE_DELAY),
  };
}

@Injectable({ providedIn: 'root' })
export class Sileo {
  readonly toasts = signal<ToastItem[]>([]);
  position: string = 'top-right';
  globalOptions?: Partial<ToastOptions>;

  /* ----------------------------- Timer maps -------------------------------- */
  readonly _timers = new Map<string, ReturnType<typeof setTimeout>>();

  /* ----------------------------- Public API -------------------------------- */

  success(opts: ToastOptions): string {
    return this._createToast({ ...opts, state: 'success' });
  }

  error(opts: ToastOptions): string {
    return this._createToast({ ...opts, state: 'error' });
  }

  warning(opts: ToastOptions): string {
    return this._createToast({ ...opts, state: 'warning' });
  }

  info(opts: ToastOptions): string {
    return this._createToast({ ...opts, state: 'info' });
  }

  action(opts: ToastOptions): string {
    return this._createToast({ ...opts, state: 'action' });
  }

  show(opts: ToastOptions): string {
    return this._createToast({ ...opts, state: opts.type ?? opts.state ?? 'success' });
  }

  promise<T>(
    promiseOrObservable: Promise<T> | Observable<T> | (() => Promise<T>),
    opts: ToastPromiseOptions<T>,
  ): Promise<T> {
    const id = this._createToast({
      ...opts.loading,
      state: 'loading',
      duration: null,
      position: opts.position,
    });

    const p =
      typeof promiseOrObservable === 'function'
        ? promiseOrObservable()
        : isObservable(promiseOrObservable)
          ? firstValueFrom(promiseOrObservable)
          : promiseOrObservable;

    p.then(data => {
      if (opts.action) {
        const actionOpts = typeof opts.action === 'function' ? opts.action(data) : opts.action;
        this._updateToast(id, { ...actionOpts, state: 'action' });
      } else {
        const successOpts = typeof opts.success === 'function' ? opts.success(data) : opts.success;
        this._updateToast(id, { ...successOpts, state: 'success' });
      }
    }).catch(err => {
      const errorOpts = typeof opts.error === 'function' ? opts.error(err) : opts.error;
      this._updateToast(id, { ...errorOpts, state: 'error' });
    });

    return p;
  }

  dismiss(id: string): void {
    const item = this.toasts().find(t => t.id === id);
    if (!item || item.exiting) return;
    // Mark as exiting for CSS fade-out animation
    this.toasts.update(prev => prev.map(t => (t.id === id ? { ...t, exiting: true } : t)));
    // Remove after exit animation completes
    setTimeout(() => {
      this.toasts.update(prev => prev.filter(t => t.id !== id));
    }, EXIT_DURATION);
  }

  clear(position?: string): void {
    this._clearAllTimers();
    this.toasts.update(prev => (position ? prev.filter(t => t.position !== position) : []));
  }

  /* ----------------------- Timer management (used by Toaster) -------------- */

  scheduleTimers(items: ToastItem[], hovered: boolean): void {
    if (hovered) return;
    for (const item of items) {
      if (item.exiting) continue;
      const key = timeoutKey(item);
      if (this._timers.has(key)) continue;
      if (item.duration === null) continue;
      const dur = item.duration ?? DEFAULT_TOAST_DURATION;
      if (dur <= 0) continue;
      this._timers.set(key, setTimeout(() => this.dismiss(item.id), dur));
    }
  }

  clearAllTimersForHover(): void {
    for (const t of this._timers.values()) clearTimeout(t);
    this._timers.clear();
  }

  pruneTimers(toasts: ToastItem[]): void {
    const keys = new Set(toasts.map(timeoutKey));
    for (const [key, timer] of this._timers) {
      if (!keys.has(key)) {
        clearTimeout(timer);
        this._timers.delete(key);
      }
    }
  }

  /* ----------------------------- Internal ---------------------------------- */

  private _clearAllTimers(): void {
    for (const t of this._timers.values()) clearTimeout(t);
    this._timers.clear();
  }

  private _mergeOptions(options: ToastOptions): ToastOptions {
    return {
      ...this.globalOptions,
      ...options,
      styles: { ...this.globalOptions?.styles, ...options.styles },
    };
  }

  private _buildItem(merged: ToastOptions, id: string, fallbackPosition?: string): ToastItem {
    const duration = merged.duration !== undefined ? merged.duration : DEFAULT_TOAST_DURATION;
    const auto = resolveAutopilot(merged, duration);
    return {
      ...merged,
      id,
      instanceId: generateId(),
      state: merged.state as ToastState,
      position: (merged.position ?? fallbackPosition ?? this.position) as ToastPosition,
      exiting: false,
      autoExpandDelayMs: auto.expandDelayMs,
      autoCollapseDelayMs: auto.collapseDelayMs,
    } as ToastItem;
  }

  private _createToast(options: ToastOptions & { state: ToastState }): string {
    const live = this.toasts().filter(t => !t.exiting);
    const merged = this._mergeOptions(options);
    const id = merged.id ?? 'sileo-default';
    const prev = live.find(t => t.id === id);
    const item = this._buildItem(merged, id, prev?.position);
    if (prev) {
      this.toasts.update(p => p.map(t => (t.id === id ? item : t)));
    } else {
      this.toasts.update(p => [...p.filter(t => t.id !== id), item]);
    }
    return id;
  }

  private _updateToast(id: string, options: ToastOptions & { state: ToastState }): void {
    const existing = this.toasts().find(t => t.id === id);
    if (!existing) return;
    const merged = this._mergeOptions(options);
    const item = this._buildItem(merged, id, existing.position);
    this.toasts.update(prev => prev.map(t => (t.id === id ? item : t)));
  }
}
