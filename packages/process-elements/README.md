# @pom4h/process-elements

Composable process automation elements built on `@pom4h/elements-core`.

```bash
npm install @pom4h/process-elements
```

Register the custom elements in a browser entrypoint:

```ts
import '@pom4h/process-elements/register';
```

Consume registry metadata without touching the DOM runtime:

```ts
import { processElementsManifest } from '@pom4h/process-elements/manifest';
```

See the repository README for the element model, ports, motion, semantic detail and scene examples.
