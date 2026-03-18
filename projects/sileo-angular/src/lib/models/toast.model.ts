/** Toast state type */
export type ToastState = 'success' | 'error' | 'warning' | 'info' | 'action' | 'loading';

/** Position of the toast viewport on screen */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type PillAlign = 'left' | 'center' | 'right';
export type ExpandDir = 'top' | 'bottom';

/** Action button displayed inside the toast */
export interface ToastButton {
  /** Button label text */
  title: string;
  /** Callback when button is clicked */
  onClick: () => void;
}

/** Custom CSS class names for toast elements */
export interface ToastStyles {
  /** CSS class for the badge/icon container */
  badge?: string;
  /** CSS class for the title text */
  title?: string;
  /** CSS class for the description text */
  description?: string;
  /** CSS class for the action button */
  button?: string;
}

/** Options for creating a toast notification */
export interface ToastOptions {
  /** Unique ID. Toasts with same ID replace each other. Default: 'sileo-default' */
  id?: string;
  /** Toast title (required) */
  title: string;
  /** Toast description body text */
  description?: string;
  /** Toast state — determines icon and color */
  state?: ToastState;
  /** Alias for state */
  type?: ToastState;
  /** Override the toaster's default position */
  position?: ToastPosition;
  /** Auto-dismiss duration in ms. Set `null` for persistent toast. Default: 6000 */
  duration?: number | null;
  /** Custom icon (not yet implemented) */
  icon?: string;
  /** Custom pill background color (e.g. '#1a1a1a') */
  fill?: string;
  /** Action button with label and click handler */
  button?: ToastButton;
  /** Custom CSS class names for toast elements */
  styles?: ToastStyles;
  /** Pill border radius in px. Default: 16 */
  roundness?: number;
  /** Auto expand/collapse behavior. `true` uses defaults, object for custom delays */
  autopilot?: boolean | { expand?: number; collapse?: number };
}

export interface ToastItem extends ToastOptions {
  id: string;
  instanceId: string;
  state: ToastState;
  position: ToastPosition;
  exiting: boolean;
  autoExpandDelayMs?: number;
  autoCollapseDelayMs?: number;
}

/** Options for promise-based toasts */
export interface ToastPromiseOptions<T = unknown> {
  /** Toast shown while the promise is pending */
  loading: ToastOptions;
  /** Toast shown when the promise resolves. Can be a function that receives the result */
  success: ToastOptions | ((data: T) => ToastOptions);
  /** Toast shown when the promise rejects. Can be a function that receives the error */
  error: ToastOptions | ((err: unknown) => ToastOptions);
  /** Optional action toast instead of success */
  action?: ToastOptions | ((data: T) => ToastOptions);
  /** Override position for all phases */
  position?: ToastPosition;
}

/* --------------------------------- Layout --------------------------------- */
export const HEIGHT = 40;
export const WIDTH = 350;
export const DEFAULT_ROUNDNESS = 16;

/* --------------------------------- Timing --------------------------------- */
export const DURATION_MS = 600;
export const DURATION_S = DURATION_MS / 1000;
export const DEFAULT_TOAST_DURATION = 6000;
export const EXIT_DURATION = DEFAULT_TOAST_DURATION * 0.1;
export const AUTO_EXPAND_DELAY = DEFAULT_TOAST_DURATION * 0.025;
export const AUTO_COLLAPSE_DELAY = DEFAULT_TOAST_DURATION - 2000;

/* --------------------------------- Render --------------------------------- */
export const BLUR_RATIO = 0.5;
export const PILL_PADDING = 10;
export const MIN_EXPAND_RATIO = 2.25;
export const SWAP_COLLAPSE_MS = 200;
export const HEADER_EXIT_MS = DURATION_MS * 0.7;

export const THEME_FILLS: Record<string, string> = {
  light: '#1a1a1a',
  dark: '#f2f2f2',
};
