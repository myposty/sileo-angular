import {
  Component,
  input,
  output,
  signal,
  computed,
  ElementRef,
  viewChild,
  OnDestroy,
  AfterViewInit,
  effect,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import {
  ToastItem,
  ToastState,
  HEIGHT,
  WIDTH,
  DEFAULT_ROUNDNESS,
  DURATION_MS,
  BLUR_RATIO,
  PILL_PADDING,
  MIN_EXPAND_RATIO,
  HEADER_EXIT_MS,
  SWAP_COLLAPSE_MS,
} from '../models/toast.model';

const SWIPE_DISMISS = 30;
const SWIPE_MAX = 20;

interface HeaderLayer {
  current: { key: string; view: ViewSnapshot };
  prev: { key: string; view: ViewSnapshot } | null;
}

interface ViewSnapshot {
  title: string;
  description?: string;
  state: ToastState;
  icon?: string;
  styles?: { badge?: string; title?: string; description?: string; button?: string };
  button?: { title: string; onClick: () => void };
  fill?: string;
}

@Component({
  selector: 'sileo-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <button
      #toastEl
      type="button"
      data-sileo-toast
      [attr.data-ready]="ready()"
      [attr.data-expanded]="open()"
      [attr.data-exiting]="toast().exiting"
      [attr.data-edge]="expandDirInput()"
      [attr.data-position]="pillAlignInput()"
      [attr.data-state]="view().state"
      [attr.style]="rootStyleStr()"
      (mouseenter)="onEnter($event)"
      (mouseleave)="onLeave($event)"
      (transitionend)="onTransitionEnd($event)"
      (pointerdown)="onPointerDown($event)"
    >
      <!-- SVG Canvas with gooey filter - ALWAYS rendered (both open and closed) -->
      <div
        data-sileo-canvas
        [attr.data-edge]="expandDirInput()"
        [style.filter]="'url(#' + filterId() + ')'"
      >
        <svg data-sileo-svg [attr.width]="WIDTH" [attr.height]="svgHeight()" [attr.viewBox]="viewBox()" style="overflow: visible">
          <title>Sileo Notification</title>
          <defs>
            <filter [attr.id]="filterId()" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
              <feGaussianBlur in="SourceGraphic" [attr.stdDeviation]="blur()" result="blur"/>
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="goo"/>
              <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
            </filter>
          </defs>
          <rect data-sileo-pill
            [attr.rx]="roundness()" [attr.ry]="roundness()"
            [attr.fill]="view().fill || '#1a1a1a'"
            [attr.width]="resolvedPillWidth()"
            [attr.height]="open() ? pillHeight() : HEIGHT"
            [attr.style]="pillStyleStr()"
          />
          <rect data-sileo-body
            [attr.y]="HEIGHT"
            [attr.width]="WIDTH"
            [attr.rx]="roundness()" [attr.ry]="roundness()"
            [attr.fill]="view().fill || '#1a1a1a'"
            [attr.height]="open() ? expandedContent() : 0"
            [attr.opacity]="open() ? 1 : 0"
            [attr.style]="bodyStyleStr()"
          />
        </svg>
      </div>

      <div #headerEl data-sileo-header [attr.data-edge]="expandDirInput()">
        <div data-sileo-header-stack>
          <div #innerEl data-sileo-header-inner data-layer="current">
            <div data-sileo-badge [attr.data-state]="headerLayer().current.view.state">
              @switch (headerLayer().current.view.state) {
                @case ('success') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Check</title><path d="M20 6 9 17l-5-5"/></svg> }
                @case ('error') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>X</title><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> }
                @case ('warning') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Circle Alert</title><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> }
                @case ('info') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Life Buoy</title><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg> }
                @case ('action') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Arrow Right</title><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> }
                @case ('loading') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-sileo-icon="spin" aria-hidden="true"><title>Loader Circle</title><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> }
              }
            </div>
            <span data-sileo-title [attr.data-state]="headerLayer().current.view.state">{{ headerLayer().current.view.title }}</span>
          </div>

          @if (headerLayer().prev) {
            <div data-sileo-header-inner data-layer="prev" data-exiting="true">
              <div data-sileo-badge [attr.data-state]="headerLayer().prev!.view.state">
                @switch (headerLayer().prev!.view.state) {
                  @case ('success') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Check</title><path d="M20 6 9 17l-5-5"/></svg> }
                  @case ('error') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>X</title><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> }
                  @case ('warning') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Circle Alert</title><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> }
                  @case ('info') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Life Buoy</title><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg> }
                  @case ('action') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><title>Arrow Right</title><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> }
                  @case ('loading') { <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-sileo-icon="spin" aria-hidden="true"><title>Loader Circle</title><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> }
                }
              </div>
              <span data-sileo-title [attr.data-state]="headerLayer().prev!.view.state">{{ headerLayer().prev!.view.title }}</span>
            </div>
          }
        </div>
      </div>

      @if (hasDesc()) {
        <div
          data-sileo-content
          [attr.data-edge]="expandDirInput()"
          [attr.data-visible]="open()"
        >
          <div #contentEl data-sileo-description
            [class]="view().styles?.description || ''">
            {{ view().description }}
            @if (view().button) {
              <a
                href="#"
                data-sileo-button
                [attr.data-state]="view().state"
                [class]="view().styles?.button || ''"
                (click)="onButtonClick($event)"
              >{{ view().button!.title }}</a>
            }
          </div>
        </div>
      }
    </button>
  `,
})
export class ToastComponent implements AfterViewInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  /* ---- Inputs ---- */
  readonly toast = input.required<ToastItem>();
  readonly pillAlignInput = input<string>('left', { alias: 'pillAlign' });
  readonly expandDirInput = input<string>('top', { alias: 'expandDir' });
  readonly canExpand = input<boolean>(true);
  readonly interruptKey = input<string | undefined>(undefined);
  readonly refreshKey = input<string | undefined>(undefined);

  /* ---- Outputs ---- */
  readonly mouseEntered = output<MouseEvent>();
  readonly mouseLeft = output<MouseEvent>();
  readonly dismissed = output<void>();

  /* ---- View children ---- */
  readonly toastEl = viewChild<ElementRef>('toastEl');
  readonly innerEl = viewChild<ElementRef>('innerEl');
  readonly headerEl = viewChild<ElementRef>('headerEl');
  readonly contentEl = viewChild<ElementRef>('contentEl');

  /* ---- Constants exposed to template ---- */
  readonly WIDTH = WIDTH;
  readonly HEIGHT = HEIGHT;

  /* ---- State ---- */
  readonly ready = signal(false);
  readonly isExpanded = signal(false);
  readonly pillWidth = signal(0);
  readonly contentHeight = signal(0);
  readonly view = signal<ViewSnapshot>({ title: '', state: 'success' });
  readonly headerLayer = signal<HeaderLayer>({
    current: { key: '', view: { title: '', state: 'success' } },
    prev: null,
  });

  private appliedRefreshKey: string | undefined = undefined;
  private lastRefreshKey: string | undefined = undefined;
  private pendingSwap: { key: string; payload: ViewSnapshot } | null = null;

  private headerExitTimer: ReturnType<typeof setTimeout> | null = null;
  private autoExpandTimer: ReturnType<typeof setTimeout> | null = null;
  private autoCollapseTimer: ReturnType<typeof setTimeout> | null = null;
  private swapTimer: ReturnType<typeof setTimeout> | null = null;
  private pillRo: ResizeObserver | null = null;
  private pillRafId = 0;
  private pillObservedEl: Element | null = null;
  private contentRo: ResizeObserver | null = null;
  private contentRafId = 0;
  private headerPad: number | null = null;
  private frozenExpanded = HEIGHT * MIN_EXPAND_RATIO;

  // Swipe state
  private pointerStartY: number | null = null;

  /* ---- Computed ---- */
  readonly filterId = computed(() => `sileo-gooey-${this.toast().id}`);
  readonly roundness = computed(() => Math.max(0, this.toast().roundness ?? DEFAULT_ROUNDNESS));
  readonly blur = computed(() => this.roundness() * BLUR_RATIO);

  readonly hasDesc = computed(() => {
    const v = this.view();
    return Boolean(v.description) || Boolean(v.button);
  });

  readonly allowExpand = computed(() => {
    const v = this.view();
    if (v.state === 'loading') return false;
    const ce = this.canExpand();
    if (ce !== undefined) return ce;
    const ik = this.interruptKey();
    return !ik || ik === this.toast().id;
  });

  readonly open = computed(() => {
    return this.hasDesc() && this.isExpanded() && this.view().state !== 'loading';
  });

  readonly minExpanded = HEIGHT * MIN_EXPAND_RATIO;

  readonly rawExpanded = computed(() => {
    return this.hasDesc()
      ? Math.max(this.minExpanded, HEIGHT + this.contentHeight())
      : this.minExpanded;
  });

  readonly expanded = computed(() => {
    if (this.open()) {
      this.frozenExpanded = this.rawExpanded();
      return this.rawExpanded();
    }
    return this.frozenExpanded;
  });

  readonly svgHeight = computed(() => {
    return this.hasDesc() ? Math.max(this.expanded(), this.minExpanded) : HEIGHT;
  });

  readonly expandedContent = computed(() => Math.max(0, this.expanded() - HEIGHT));
  readonly resolvedPillWidth = computed(() => Math.max(this.pillWidth() || HEIGHT, HEIGHT));
  readonly pillHeight = computed(() => HEIGHT + this.blur() * 3);

  readonly pillX = computed(() => {
    const pos = this.pillAlignInput();
    const pw = this.resolvedPillWidth();
    return pos === 'right' ? WIDTH - pw : pos === 'center' ? (WIDTH - pw) / 2 : 0;
  });

  readonly viewBox = computed(() => `0 0 ${WIDTH} ${this.svgHeight()}`);

  // CSS transition strings for SVG elements
  readonly pillTransitionStr = computed(() => {
    if (!this.ready()) return 'none';
    const dur = `${DURATION_MS}ms`;
    const ease = 'var(--sileo-spring-easing)';
    return `transform ${dur} ${ease}, width ${dur} ${ease}, height ${dur} ${ease}`;
  });

  readonly bodyStyleStr = computed(() => {
    const o = this.open();
    const dur = `${DURATION_MS}ms`;
    // When closing, no bounce (like React's bounce:0) - use ease instead of spring
    const easing = o ? 'var(--sileo-spring-easing)' : 'ease';
    const transition = this.ready()
      ? `height ${dur} ${easing}, opacity ${dur} ${easing}`
      : 'none';
    return `transition: ${transition}`;
  });

  readonly pillStyleStr = computed(() => {
    const px = this.pillX();
    const transition = this.pillTransitionStr();
    return `transform: translateX(${px}px); transition: ${transition}`;
  });

  // Canvas style: filter + fixed height to clip SVG filter blur
  readonly canvasStyleStr = computed(() => {
    const o = this.open();
    const fid = this.filterId();
    const h = o ? this.expanded() : HEIGHT;
    const overflow = o ? 'visible' : 'hidden';
    return `filter: url(#${fid}); height: ${h}px; overflow: ${overflow}`;
  });

  readonly rootStyleStr = computed(() => {
    const o = this.open();
    const exp = this.expanded();
    const pw = this.resolvedPillWidth();
    const px = this.pillX();
    const ed = this.expandDirInput();
    return `--_h: ${o ? exp : HEIGHT}px; --_pw: ${pw}px; --_px: ${px}px; --_ht: translateY(${o ? (ed === 'bottom' ? 3 : -3) : 0}px) scale(${o ? 0.9 : 1}); --_co: ${o ? 1 : 0}`;
  });

  constructor() {
    // Initialize view from toast input
    effect(() => {
      const t = this.toast();
      const next: ViewSnapshot = {
        title: t.title,
        description: t.description,
        state: t.state,
        icon: t.icon,
        styles: t.styles,
        button: t.button,
        fill: t.fill,
      };

      const rk = this.refreshKey();

      // If refreshKey is undefined, just apply directly
      if (rk === undefined) {
        this.view.set(next);
        this.appliedRefreshKey = undefined;
        this.pendingSwap = null;
        this.lastRefreshKey = rk;
        this._syncHeaderLayer(next);
        return;
      }

      // If same refreshKey, skip
      if (this.lastRefreshKey === rk) return;
      this.lastRefreshKey = rk;

      if (this.swapTimer) {
        clearTimeout(this.swapTimer);
        this.swapTimer = null;
      }

      if (this.open()) {
        // Collapse first, then swap
        this.pendingSwap = { key: rk, payload: next };
        this.isExpanded.set(false);
        this.swapTimer = setTimeout(() => {
          this.swapTimer = null;
          const pending = this.pendingSwap;
          if (!pending) return;
          this.view.set(pending.payload);
          this.appliedRefreshKey = pending.key;
          this.pendingSwap = null;
          this._syncHeaderLayer(pending.payload);
        }, SWAP_COLLAPSE_MS);
      } else {
        this.pendingSwap = null;
        this.view.set(next);
        this.appliedRefreshKey = rk;
        this._syncHeaderLayer(next);
      }
    }, { allowSignalWrites: true });

    // Auto expand/collapse effect - wait for ready before expanding
    effect(() => {
      const hd = this.hasDesc();
      const t = this.toast();
      const ae = this.allowExpand();
      const exiting = t.exiting;
      const isReady = this.ready();

      if (!hd) return;

      if (this.autoExpandTimer) { clearTimeout(this.autoExpandTimer); this.autoExpandTimer = null; }
      if (this.autoCollapseTimer) { clearTimeout(this.autoCollapseTimer); this.autoCollapseTimer = null; }

      if (exiting) return;
      if (!ae || !isReady) {
        this.isExpanded.set(false);
        return;
      }

      const expandDelay = t.autoExpandDelayMs;
      const collapseDelay = t.autoCollapseDelayMs;

      if (expandDelay == null && collapseDelay == null) return;

      const ed = expandDelay ?? 0;
      const cd = collapseDelay ?? 0;

      if (ed > 0) {
        this.autoExpandTimer = setTimeout(() => this.isExpanded.set(true), ed);
      } else {
        this.isExpanded.set(true);
      }

      if (cd > 0) {
        this.autoCollapseTimer = setTimeout(() => this.isExpanded.set(false), cd);
      }
    }, { allowSignalWrites: true });
  }

  ngAfterViewInit(): void {
    // Use rAF to delay ready by one frame (matches React's useEffect + rAF pattern)
    // Then markForCheck to ensure Angular picks up the signal change in zoneless mode
    requestAnimationFrame(() => {
      this.ready.set(true);
      this.cdr.markForCheck();
    });
    this._measurePillWidth();
    this._measureContent();
  }

  ngOnDestroy(): void {
    this.pillRo?.disconnect();
    cancelAnimationFrame(this.pillRafId);
    this.contentRo?.disconnect();
    cancelAnimationFrame(this.contentRafId);
    if (this.headerExitTimer) clearTimeout(this.headerExitTimer);
    if (this.autoExpandTimer) clearTimeout(this.autoExpandTimer);
    if (this.autoCollapseTimer) clearTimeout(this.autoCollapseTimer);
    if (this.swapTimer) clearTimeout(this.swapTimer);
  }

  /* ---- Event handlers ---- */

  onEnter(e: MouseEvent): void {
    this.mouseEntered.emit(e);
    if (this.hasDesc() && this.allowExpand()) {
      this.isExpanded.set(true);
    }
  }

  onLeave(e: MouseEvent): void {
    this.mouseLeft.emit(e);
    this.isExpanded.set(false);
  }

  onTransitionEnd(e: TransitionEvent): void {
    if (e.propertyName !== 'height' && e.propertyName !== 'transform') return;
    if (this.open()) return;
    const pending = this.pendingSwap;
    if (!pending) return;
    if (this.swapTimer) {
      clearTimeout(this.swapTimer);
      this.swapTimer = null;
    }
    this.view.set(pending.payload);
    this.appliedRefreshKey = pending.key;
    this.pendingSwap = null;
    this._syncHeaderLayer(pending.payload);
  }

  onPointerDown(e: PointerEvent): void {
    if (this.toast().exiting) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-sileo-button]')) return;
    this.pointerStartY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const el = this.toastEl()?.nativeElement as HTMLElement;
    if (!el) return;

    const onMove = (me: PointerEvent) => {
      if (this.pointerStartY === null) return;
      const dy = me.clientY - this.pointerStartY;
      const sign = dy > 0 ? 1 : -1;
      const clamped = Math.min(Math.abs(dy), SWIPE_MAX) * sign;
      el.style.transform = `translateY(${clamped}px)`;
    };

    const onUp = (ue: PointerEvent) => {
      if (this.pointerStartY === null) return;
      const dy = ue.clientY - this.pointerStartY;
      this.pointerStartY = null;
      el.style.transform = '';
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      if (Math.abs(dy) > SWIPE_DISMISS) {
        this.dismissed.emit();
      }
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerup', onUp, { passive: true });
  }

  onButtonClick(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.view().button?.onClick();
  }

  /* ---- Header morphing ---- */

  private _syncHeaderLayer(next: ViewSnapshot): void {
    const headerKey = `${next.state}-${next.title}`;
    this.headerLayer.update(state => {
      if (state.current.key === headerKey) {
        if (state.current.view === next) return state;
        return { ...state, current: { key: headerKey, view: next } };
      }
      return {
        prev: state.current,
        current: { key: headerKey, view: next },
      };
    });

    // Schedule prev layer removal
    const hl = this.headerLayer();
    if (hl.prev) {
      if (this.headerExitTimer) clearTimeout(this.headerExitTimer);
      this.headerExitTimer = setTimeout(() => {
        this.headerExitTimer = null;
        this.headerLayer.update(s => ({ ...s, prev: null }));
      }, HEADER_EXIT_MS);
    }
  }

  /* ---- Measurement ---- */

  private _measurePillWidth(): void {
    const el = this.innerEl()?.nativeElement;
    const header = this.headerEl()?.nativeElement;
    if (!el || !header) return;

    if (this.headerPad === null) {
      const cs = getComputedStyle(header);
      this.headerPad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    }
    const px = this.headerPad;

    const measure = () => {
      const w = el.scrollWidth + px + PILL_PADDING;
      if (w > PILL_PADDING) {
        const cur = this.pillWidth();
        if (cur !== w) this.pillWidth.set(w);
      }
    };

    measure();

    this.pillRo = new ResizeObserver(() => {
      cancelAnimationFrame(this.pillRafId);
      this.pillRafId = requestAnimationFrame(() => {
        const inner = this.innerEl()?.nativeElement;
        const pad = this.headerPad ?? 0;
        if (!inner) return;
        const w = inner.scrollWidth + pad + PILL_PADDING;
        if (w > PILL_PADDING) {
          const cur = this.pillWidth();
          if (cur !== w) {
            this.pillWidth.set(w);
            this.cdr.markForCheck();
          }
        }
      });
    });
    this.pillRo.observe(el);
    this.pillObservedEl = el;
  }

  private _measureContent(): void {
    const el = this.contentEl()?.nativeElement;
    if (!el) return;

    const measure = () => {
      const h = el.scrollHeight;
      const cur = this.contentHeight();
      if (cur !== h) {
        this.contentHeight.set(h);
        this.cdr.markForCheck();
      }
    };

    measure();
    this.contentRo = new ResizeObserver(() => {
      cancelAnimationFrame(this.contentRafId);
      this.contentRafId = requestAnimationFrame(measure);
    });
    this.contentRo.observe(el);
  }
}
