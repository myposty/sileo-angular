export type ToastState = 'success' | 'error' | 'warning' | 'info' | 'action' | 'loading';

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type PillAlign = 'left' | 'center' | 'right';
export type ExpandDir = 'top' | 'bottom';

export interface ToastButton {
  title: string;
  onClick: () => void;
}

export interface ToastStyles {
  badge?: string;
  title?: string;
  description?: string;
  button?: string;
}

export interface ToastOptions {
  id?: string;
  title: string;
  description?: string;
  state?: ToastState;
  type?: ToastState;
  position?: ToastPosition;
  duration?: number | null;
  icon?: string;
  fill?: string;
  button?: ToastButton;
  styles?: ToastStyles;
  roundness?: number;
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

export interface ToastPromiseOptions<T = unknown> {
  loading: ToastOptions;
  success: ToastOptions | ((data: T) => ToastOptions);
  error: ToastOptions | ((err: unknown) => ToastOptions);
  action?: ToastOptions | ((data: T) => ToastOptions);
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
