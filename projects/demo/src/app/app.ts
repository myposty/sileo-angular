import { Component, inject } from '@angular/core';
import { SileoToaster, Sileo } from 'sileo-angular';

@Component({
  selector: 'app-root',
  imports: [SileoToaster],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private sileo = inject(Sileo);

  showSuccess() {
    this.sileo.success({ title: 'Success', description: 'Your changes have been saved successfully.' });
  }

  showError() {
    this.sileo.error({ title: 'Error', description: 'Something went wrong. Please try again.' });
  }

  showWarning() {
    this.sileo.warning({ title: 'Warning', description: 'Your storage is almost full. Please upgrade your plan to continue.' });
  }

  showInfo() {
    this.sileo.info({ title: 'Info', description: 'A new version of the app is available.' });
  }

  showAction() {
    this.sileo.action({
      title: 'Action',
      description: 'File has been deleted.',
      button: { title: 'Undo', onClick: () => this.sileo.success({ title: 'Restored' }) },
    });
  }

  showPromise() {
    this.sileo.promise(new Promise(r => setTimeout(() => r('Done'), 2000)), {
      loading: { title: 'Loading' },
      success: d => ({ title: 'Success', description: String(d) }),
      error: () => ({ title: 'Error' }),
    });
  }
}
