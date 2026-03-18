// sileo-angular - Angular toast notifications with SVG morphing and spring physics

// Service
export { Sileo } from './lib/services/sileo.service';

// Components
export { SileoToaster } from './lib/components/toaster.component';
export { ToastComponent } from './lib/components/toast.component';

// Models
export type {
  ToastState,
  ToastPosition,
  ToastOptions,
  ToastItem,
  ToastPromiseOptions,
  ToastButton,
  ToastStyles,
  PillAlign,
  ExpandDir,
} from './lib/models/toast.model';

export {
  HEIGHT,
  WIDTH,
  DEFAULT_ROUNDNESS,
  DURATION_MS,
  DEFAULT_TOAST_DURATION,
  THEME_FILLS,
} from './lib/models/toast.model';
