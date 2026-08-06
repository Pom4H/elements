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

## Observer-dependent representations

One physical object can expose different models without changing its public identity or ports:

```text
symbol → operational → structural → twin
```

A parent scene or any marked container provides the observer context:

```html
<elements-scene
  observer-role="operator"
  observer-intent="monitor"
  observer-scale="system">
  <pe-pump id="p-101" status="normal"></pe-pump>
</elements-scene>
```

The runtime selects the appropriate representation and reflects it as `data-representation`. A maintenance observer at equipment scale receives a structural model; an engineer simulating a component receives the digital twin. Elements may override the decision with `representation="twin"`.

Representation fidelity is independent from `detail`. Representation chooses **which model is relevant**; detail chooses **what remains readable at the current pixel size**. See [`docs/observer-protocol.md`](docs/observer-protocol.md).

## Core

Elements keeps the runtime narrow and delegates rendering and timing to the browser.

### Composition

Complex elements are assembled from static SVG templates and keyed fragments mounted into named regions. Repeated geometry can be generated parametrically while fragments retain stable instance keys and per-instance SVG ID namespacing.

Collection callbacks receive the resolved observer and representation, so the same definition can mount a P&ID symbol, an operational schematic, a service cutaway or a physical twin from different fragment sets.

### Viewport and detail

Element definitions may provide a static or context-derived `viewBox`. Parameterically composed devices therefore keep a tight viewport as modules are added or removed.

Visual parts can be classified as `essential`, `standard`, or `fine`. Elements expose a common `detail="auto | full | compact | symbol"` contract, and `auto` uses container queries to preserve readability at small sizes.

Parts can also declare `minimumFidelity` to exist only in structural or twin representations.

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
attributes + observer → representation → derived states → viewport
                      → fragment reconciliation → bindings → motion reconciliation
```

Bindings update text, attributes and CSS properties without rebuilding the component SVG.

### Registry metadata

Every definition exposes enough structure for documentation, inspectors and visual editors:

```text
attributes · states · parts · detail · representations · ports · motions · composition · viewport
```

The manifest layer is independent from the DOM runtime and can be consumed by CLI tools, RSC, documentation generators and registry services. Manifests identify the observer protocol as `elements/observer-v1` and state which invariants each representation preserves.

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
