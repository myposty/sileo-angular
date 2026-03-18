import { Component, inject, signal } from '@angular/core';
import { SileoToaster, Sileo, ToastPosition } from 'sileo-angular';

@Component({
  selector: 'app-root',
  imports: [SileoToaster],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  sileo = inject(Sileo);
  position = signal<ToastPosition>('top-right');

  positions: ToastPosition[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

  setPosition(pos: ToastPosition) {
    this.position.set(pos);
  }

  showSuccess() {
    this.sileo.success({ title: 'Event Created', description: 'Your event has been created successfully.' });
  }

  showError() {
    this.sileo.error({ title: 'Error', description: 'There was an error with your request.' });
  }

  showWarning() {
    this.sileo.warning({ title: 'Storage Almost Full', description: "You've used 95% of your available storage. Please upgrade your plan to continue." });
  }

  showInfo() {
    this.sileo.info({ title: 'New Update Available', description: 'Version 2.0 is now available. Please update your app to continue using the latest features.' });
  }

  showAction() {
    this.sileo.action({
      title: 'File Deleted',
      description: 'The file has been permanently removed from your workspace.',
      button: { title: 'Undo', onClick: () => this.sileo.success({ title: 'File Restored' }) },
    });
  }

  showPromise() {
    this.sileo.promise(new Promise(r => setTimeout(() => r('Done'), 2000)), {
      loading: { title: 'Saving Changes', description: 'Please wait while we save your changes...' },
      success: () => ({ title: 'Changes Saved', description: 'All your changes have been saved successfully.' }),
      error: () => ({ title: 'Save Failed', description: 'Could not save changes. Please try again.' }),
    });
  }

  copyInstall() {
    navigator.clipboard.writeText('npm install sileo-angular');
    this.sileo.success({ title: 'Copied to clipboard' });
  }
}
