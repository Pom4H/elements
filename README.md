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

A `scrub` may declare a `settle` time. Mechanical parts read as broken when they teleport between telemetry samples, so the timeline travels to the new position instead of jumping to it. The first application and reduced motion always snap.

```ts
{
  id: 'stem-travel', type: 'scrub', target: 'stem-travel',
  progress: (context) => position(context) / 100,
  settle: 420,
  keyframes: [{ transform: 'translateY(0px)' }, { transform: 'translateY(-28px)' }],
  options: { duration: 1000, fill: 'both' },
}
```

A motion target must not carry an SVG layout `transform` of its own: the CSS transform the runtime applies replaces the presentation attribute rather than composing with it. Place layout transforms on a wrapping group, and nest motion targets when two motions drive the same part.

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

Attributes are described, not just parsed: each one declares a kind, and numbers carry their range, step and engineering unit while enums carry their accepted values. That is what lets a tool build the right control for an attribute it has never seen.

```ts
attribute.number('level', { minimum: 0, maximum: 100, step: 1, unit: '%' });
attribute.enum('orientation', ['vertical', 'horizontal'], { defaultValue: 'vertical' });
```

The manifest layer is independent from the DOM runtime and can be consumed by CLI tools, RSC, documentation generators and registry services.

### Configuration and conversion

`@pom4h/elements-core/editing` adds an opt-in editing layer over that metadata.

```html
<elements-scene id="scene">…</elements-scene>
<elements-inspector for="scene"></elements-inspector>
```

Right-clicking an element opens a panel generated from its definition — every attribute with the control its kind calls for, the ports resolved against the live instance, and the elements it can be converted into. It gains controls for a new element the moment that element is registered.

Conversion compares ports rather than names. A target can stand in when it offers a port of the same domain and role for each port the source declares; identical ids win outright, and no target port is claimed twice. Attributes carry across when both sides declare the same name and the same kind. Anything that would strand a connected line is reported before the swap, not after.

```ts
conversionCandidates(definition, { usedPorts: ['in', 'out'] });
convertElement(element, 'pe-control-valve');
```

The definition registry lives on a shared symbol rather than in module scope: a workspace can reach the same build through more than one path and end up with two copies of the runtime, and every copy has to see the same elements.

### Ports

A port carries a position, a facing direction, a domain `kind`, an optional `role` and an optional `medium`. Like `viewBox`, a port set may be static or derived from context, so the shape of a device changes its connection surface:

```ts
ports: ports(defaultPorts, (context) => [
  ...processPorts(context),
  ...(actuators[actuatorKind(context)].ports ?? []),
])
```

A tank with four nozzles exposes four more anchors than the same definition with one, and a valve exposes an air supply or a power gland depending on which actuator is mounted. Scenes therefore read ports off the live instance:

```ts
element.ports;        // resolved against the current attributes
element.port('out');
```

Endpoints are validated when a connection is routed. Two ports of different domains, two ports facing the same way, or two ports carrying different media are flagged on the rendered connection rather than silently drawn.

### Media

Process substances are a shared vocabulary. Every medium owns one CSS custom property, so pipe bores, tank liquid and nozzle stubs recolour together and an application can restyle water everywhere from a single declaration:

```text
water · steam · condensate · oil · fuel · gas · air · chemical · slurry · glycol
```

A port that declares a medium wins over the connection attribute, so a pipe leaving an oil nozzle stays amber even when the markup forgets to say so.

### Routing and scene connections

The core includes orthogonal connection routing for pipes, wires and signal lines:

```ts
const points = routeOrthogonal(sourcePort, targetPort);
const path = pointsToRoundedPath(points, 10);
```

Routes account for port direction, generate straight/L/Z/U paths, remove redundant points and produce rounded SVG paths.

Runs also step around whatever is in the way. `routeAvoiding` builds a lattice from the obstacle edges and the endpoint stubs and searches it for the cheapest turn-averse path, charging `bendPenalty` for every corner so a route buys straightness with length:

```ts
routeAvoiding(source, target, obstacles, { margin: 16, bendPenalty: 30 });
```

A clear run returns the direct route untouched, so obstacles never disturb a connection that did not need them. Running along an obstacle's clearance edge is allowed, which is what lets a route hug equipment instead of detouring around the whole scene. A rectangle an endpoint already sits inside is ignored — there is nothing to avoid — and if no path exists at all the direct route stands. The scene feeds every equipment rectangle in as an obstacle except the ones owning the run's own endpoints.

`el-pipe`, `el-wire` and `el-signal` are the semantic connection tags; `el-connection` remains the generic form. Each declares its endpoints and lets the owning scene route the path and own the flow animation.

```html
<elements-scene>
  <pe-tank id="t1" x="20" y="40" level="72" nozzles="2"></pe-tank>
  <pe-control-valve id="v1" x="600" y="195" position="68" command="75" powered></pe-control-valve>
  <pe-pump id="p1" x="830" y="235" running speed="1450"></pe-pump>
  <el-junction id="j1" x="300" y="296" medium="water"></el-junction>

  <el-pipe id="header" from="t1:out" to="j1" flowing></el-pipe>
  <el-pipe id="branches" from="j1" to="v1:in v2:in" flowing></el-pipe>
  <el-pipe id="recycle" from="p1:out" to="t1:in" flowing insulated></el-pipe>
  <el-pipe id="vent" from="recycle" to="t1:vent" diameter="8"></el-pipe>
</elements-scene>
```

### Junctions

`el-junction` is a named point runs can start at or end on, placed where no equipment stands. It is referenced by bare id, like a tap, and the scene tells the two apart by what the id names.

A junction has no facing of its own: it takes the direction that points at whatever sits on the other end of the run, so lines meet it head-on from any side. The scene sizes the fitting from the widest run reaching it and reports the number of runs in `data-links`, so the same element reads as a coupling, a tee or a cross without being told which it is. It is laid out from `x`/`y` like equipment, so it drags and re-routes the same way.

### Branches, tees and taps

A run is not limited to two endpoints.

`to` accepts several endpoints. The first defines the trunk; every other one leaves the trunk at its nearest point, which is what turns a connection into a **tee**. Branch positions are chosen by orthogonal distance, so a branch leaves the leg that gives it the shortest run.

A `from` that names a **connection instead of a port** taps that run rather than starting at equipment. `from="recycle"` taps wherever the branch is shortest; `from="recycle@0.35"` forces the position along the run. A tap inherits the medium of the run it leaves, and when its diameter is smaller the fitting is drawn as a **reducing tee**.

Runs that start at a port are routed before runs that tap them, so document order does not matter for the common case.

```ts
const { trunk, branches, tees } = routeBranched(source, targets, stub);
const anchor = tapPolyline(trunk, towards);   // { point, direction }
```

Every polyline of a run is emitted as one multi-subpath `d`, so a tee is a single stroked element per layer and the flow dash restarts on each branch.

## Reference elements

`pe-pump` exercises layered hydraulic geometry, mechanical motion, process flow, quality and alarm states, and responsive level of detail.

`pe-control-valve` exercises a swappable actuator fragment whose auxiliary port changes with it, separate actual and commanded travel on one scale, settled stem scrubbing, `opening`/`closing`/`stuck`/`manual` states, and normally-open versus normally-closed rendering.

`pe-tank` exercises clip-path liquid with a nested surface wave, warning bands and alarm marks whose geometry follows the configured limits, a generated nozzle set that adds matching ports, optional agitator and heater, and vertical or horizontal bodies with a context-derived viewport.

`pe-controller` exercises generated I/O modules, a context-derived viewport, live channel indicators, scan motion, communication transitions and numeric load scrubbing.

## Playground

`x` and `y` are layout attributes the scene owns, and every connection re-routes when they change, so placing equipment needs nothing beyond writing new numbers. The playground uses that for direct manipulation: drag any piece of equipment to re-route the lines around it, hold Alt to ignore the placement grid, or focus an item and nudge it with the arrow keys (Shift for a coarse step).

## Development

```bash
bun install
bun run dev
bun run check
```

## License

MIT
