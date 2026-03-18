# sileo-angular

An opinionated toast component for Angular with SVG morphing, spring physics, and a minimal API. Based on [Sileo](https://github.com/hiaaryan/sileo).

**[Live Demo](https://myposty.github.io/sileo-angular/)** | **[Documentation](https://github.com/myposty/sileo-angular)**

## Installation

```sh
$ npm install sileo-angular
```

## Quick Start

```typescript
import { SileoToaster, Sileo } from 'sileo-angular';

@Component({
  imports: [SileoToaster],
  template: `
    <sileo-toaster position="top-right" theme="light" />
  `,
})
export class App {
  private sileo = inject(Sileo);

  notify() {
    this.sileo.success({ title: 'Done', description: 'Changes saved.' });
  }
}
```

## Toast Types

```typescript
sileo.success({ title: 'Saved', description: 'Your changes are live.' });
sileo.error({ title: 'Failed', description: 'Something went wrong.' });
sileo.warning({ title: 'Careful', description: 'Storage almost full.' });
sileo.info({ title: 'Update', description: 'New version available.' });
sileo.action({ title: 'Deleted', button: { title: 'Undo', onClick: () => {} } });
sileo.promise(asyncFn(), {
  loading: { title: 'Saving...' },
  success: () => ({ title: 'Saved' }),
  error: () => ({ title: 'Failed' }),
});
```

## Features

- Success, Error, Warning, Info, Action, Promise toasts
- SVG gooey morphing animation
- Spring physics easing
- 6 position options
- Light / Dark / System themes
- Auto-expand with description
- Swipe to dismiss
- Zero config — just works

## License

MIT
