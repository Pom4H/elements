# Elements

**A runtime and registry model for composable, stateful SVG elements.**

Elements turns SVG assets into native HTML elements with a documented attribute API, semantic parts, derived states, coordinated motion and connection ports.

```html
<pe-pump
  label="P-101"
  running
  speed="1450"
  value="6.2"
  unit="bar"
  status="normal"
  quality="good">
</pe-pump>
```

```ts
import '@pom4h/process-elements/register';
```

The same component works in plain HTML, React, Vue, Astro, Electron, Capacitor and browser-based editors. Definitions and manifests are server-safe; custom element registration is isolated in browser entrypoints.

## Core

Elements keeps the runtime narrow and delegates rendering and timing to the browser.

### Composition

Complex elements are assembled from static SVG templates and keyed fragments mounted into named regions.

```ts
collections: [{
  mount: 'controller',
  items: ({ attributes }) => [
    enclosure,
    ...createInputChannels(attributes.inputs),
    ...createOutputChannels(attributes.outputs),
  ],
}]
```

Fragments provide reusable geometry without introducing a virtual DOM. IDs and SVG references are namespaced per instance, parts remain discoverable, and repeated modules keep stable keys.

### Motion

Motion is declared through three runtime primitives:

| Mode | Purpose | Example |
| --- | --- | --- |
| `loop` | active while a state is true | rotor, flow, scan cycle |
| `transition` | plays when a signal changes | startup kick, network activity |
| `scrub` | binds timeline position to a number | level, load, progress |

```ts
{
  id: 'rotor-spin',
  type: 'loop',
  target: 'rotor',
  active: ({ states }) => states.running,
  playbackRate: ({ attributes }) => Number(attributes.speed) / 1450,
  phase: 'process-mechanical',
  keyframes: [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(360deg)' },
  ],
  options: { duration: 1000, iterations: Infinity, easing: 'linear' },
}
```

Animations use the Web Animations API. A shared `MotionScope` aligns phases across parts and elements, while reduced-motion behavior is part of every motion contract.

### State and bindings

Attributes are the public API. Runtime updates are batched, parsed into typed values and transformed into derived states.

```text
attributes → derived states → fragment reconciliation → bindings → motion reconciliation
```

Bindings update text, attributes and CSS properties without rebuilding the component SVG.

### Registry metadata

Every definition exposes enough structure for documentation, inspectors and visual editors:

```text
attributes · states · parts · ports · motions · composition
```

The manifest layer is independent from the DOM runtime and can be consumed by CLI tools, RSC, documentation generators and registry services.

### Routing

The core includes orthogonal connection routing for pipes, wires and signal lines:

```ts
const points = routeOrthogonal(sourcePort, targetPort);
const path = pointsToRoundedPath(points, 10);
```

Routes account for port direction, generate straight/L/Z/U paths, remove redundant points and produce rounded SVG paths.

## Packages

```text
packages/core              attribute, composition, motion, manifest and routing runtime
packages/process-elements  pump and programmable controller reference elements
apps/playground            live registry and runtime playground
```

## Development

```bash
bun install
bun run dev
```

```bash
bun run typecheck
bun test
bun run build
```

## License

MIT
