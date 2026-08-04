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

Complex elements are assembled from static SVG templates and keyed fragments mounted into named regions. Repeated geometry can be generated parametrically while fragments retain stable instance keys and per-instance SVG ID namespacing.

### Viewport and detail

Element definitions may provide a static or context-derived `viewBox`. Parameterically composed devices therefore keep a tight viewport as modules are added or removed.

Visual parts can be classified as `essential`, `standard`, or `fine`. Elements expose a common `detail="auto | full | compact | symbol"` contract, and `auto` uses container queries to preserve readability at small sizes.

### Motion

Motion is declared through three runtime primitives:

| Mode | Purpose | Example |
| --- | --- | --- |
| `loop` | active while a state is true | rotor, flow, scan cycle |
| `transition` | plays when a signal changes | startup kick, network activity |
| `scrub` | binds timeline position to a number | level, load, progress |

Animations use the Web Animations API. A shared `MotionScope` aligns phases across parts and elements, while reduced-motion behavior is part of every motion contract.

### State and bindings

Attributes are the public API. Runtime updates are batched, parsed into typed values and transformed into derived states.

```text
attributes → derived states → viewport → fragment reconciliation → bindings → motion reconciliation
```

Bindings update text, attributes and CSS properties without rebuilding the component SVG.

### Registry metadata

Every definition exposes enough structure for documentation, inspectors and visual editors:

```text
attributes · states · parts · detail · ports · motions · composition · viewport
```

The manifest layer is independent from the DOM runtime and can be consumed by CLI tools, RSC, documentation generators and registry services.

### Routing

The core includes orthogonal connection routing for pipes, wires and signal lines:

```ts
const points = routeOrthogonal(sourcePort, targetPort);
const path = pointsToRoundedPath(points, 10);
```

Routes account for port direction, generate straight/L/Z/U paths, remove redundant points and produce rounded SVG paths.

## Reference elements

`pe-pump` exercises layered hydraulic geometry, mechanical motion, process flow, quality and alarm states, and responsive level of detail.

`pe-controller` exercises generated I/O modules, a context-derived viewport, live channel indicators, scan motion, communication transitions and numeric load scrubbing.

## Development

```bash
bun install
bun run dev
bun run check
```

## License

MIT
