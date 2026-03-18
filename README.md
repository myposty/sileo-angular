# sileo-angular

A faithful Angular port of [Sileo](https://sileo.aaryan.design/) — an opinionated, physics-based toast notification library.

> **All credits to [Aaryan Kapoor](https://github.com/hiaaryan) for the original [Sileo](https://github.com/hiaaryan/sileo) React library.** This project is a direct port to Angular, preserving the same visual design, SVG morphing, spring physics animations, and minimal API.

## Installation

```bash
npm install sileo-angular
```

## Setup

Import the CSS in your global styles:

```scss
@import 'sileo-angular/src/lib/styles/sileo.css';
```

## Usage

### 1. Add the Toaster component

```typescript
import { Component } from '@angular/core';
import { SileoToaster } from 'sileo-angular';

@Component({
  selector: 'app-root',
  imports: [SileoToaster],
  template: `
    <sileo-toaster position="top-right" theme="light" />
  `,
})
export class App {}
```

### 2. Show toasts

```typescript
import { inject } from '@angular/core';
import { Sileo } from 'sileo-angular';

export class MyComponent {
  private sileo = inject(Sileo);

  showSuccess() {
    this.sileo.success({
      title: 'Success',
      description: 'Your changes have been saved.',
    });
  }

  showError() {
    this.sileo.error({
      title: 'Error',
      description: 'Something went wrong.',
    });
  }
}
```

## Toast Types

```typescript
sileo.success({ title: 'Success', description: '...' });
sileo.error({ title: 'Error', description: '...' });
sileo.warning({ title: 'Warning', description: '...' });
sileo.info({ title: 'Info', description: '...' });
sileo.action({
  title: 'Deleted',
  description: 'File removed.',
  button: { title: 'Undo', onClick: () => { /* ... */ } },
});
```

## Promise Toast

```typescript
sileo.promise(fetchData(), {
  loading: { title: 'Loading...' },
  success: (data) => ({ title: 'Done', description: String(data) }),
  error: (err) => ({ title: 'Failed' }),
});
```

## Toaster Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'top-left' \| 'top-center' \| 'top-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'` | `'top-right'` | Toast position |
| `theme` | `'light' \| 'dark' \| 'system'` | — | Color theme |
| `offset` | `number \| { top?, right?, bottom?, left? }` | — | Viewport offset |

## Toast Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Toast title |
| `description` | `string` | — | Toast body text |
| `duration` | `number \| null` | `6000` | Auto-dismiss ms (`null` = persistent) |
| `position` | `ToastPosition` | — | Override toaster position |
| `button` | `{ title, onClick }` | — | Action button |
| `fill` | `string` | — | Custom pill background color |
| `roundness` | `number` | `16` | Border radius |

## Development

```bash
# Install dependencies
npm install

# Build the library
ng build sileo-angular

# Run the demo
ng serve demo --port=4300
```

## Credits

- Original library: [Sileo](https://github.com/hiaaryan/sileo) by [Aaryan Kapoor](https://github.com/hiaaryan)
- Website: [sileo.aaryan.design](https://sileo.aaryan.design/)
- License: MIT
