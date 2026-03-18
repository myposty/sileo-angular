import { Component, input } from '@angular/core';
import { ToastState } from '../models/toast.model';

@Component({
  selector: 'sileo-toast-icon',
  standalone: true,
  host: { style: 'display: contents' },
  template: `
    @switch (state()) {
      @case ('success') {
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <title>Check</title>
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      }
      @case ('error') {
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <title>X</title>
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        </svg>
      }
      @case ('warning') {
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <title>Circle Alert</title>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" x2="12" y1="8" y2="12"/>
          <line x1="12" x2="12.01" y1="16" y2="16"/>
        </svg>
      }
      @case ('info') {
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <title>Life Buoy</title>
          <circle cx="12" cy="12" r="10"/>
          <path d="m4.93 4.93 4.24 4.24"/>
          <path d="m14.83 9.17 4.24-4.24"/>
          <path d="m14.83 14.83 4.24 4.24"/>
          <path d="m9.17 14.83-4.24 4.24"/>
          <circle cx="12" cy="12" r="4"/>
        </svg>
      }
      @case ('action') {
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <title>Arrow Right</title>
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      }
      @case ('loading') {
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          data-sileo-icon="spin" aria-hidden="true">
          <title>Loader Circle</title>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      }
    }
  `,
})
export class ToastIconComponent {
  readonly state = input.required<ToastState>();
}
