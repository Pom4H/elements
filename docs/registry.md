# Source registry

Elements uses a shadcn-style distribution model for concrete graphical elements: the runtime remains a dependency, while an element's implementation can be copied into the consuming project and become application-owned source.

## Install source

The repository root is a standard shadcn GitHub source registry. No Elements-specific downloader or registry server is required.

```bash
bunx shadcn@latest add Pom4H/elements/process-pump
bunx shadcn@latest add Pom4H/elements/electrical-motor
bunx shadcn@latest add Pom4H/elements/electrical-breaker
```

A registry item copies its definition, shared drawing helpers and browser registration entrypoint into the consumer. Import the copied registration entrypoint once and use the native custom element directly.

```ts
import './src/elements/electrical-motor/register.ts';
```

```html
<ee-motor running speed="1450" load="72" current="12.4" quality="good"></ee-motor>
```

The consumer is expected to edit copied source when a project needs different geometry, parts, states, ports or motion. Source ownership is the product model, not an escape hatch.

## Contract layering

`registry.json` uses the shadcn registry schema as its distribution contract. Elements semantics live in versioned, server-safe package manifests. Every registry item points to an exact manifest artifact and tag instead of relying on package or tag-name conventions.

```text
shadcn registry item
├── files / targets / dependencies
└── meta.elements
    ├── schemaVersion
    ├── tagName
    ├── runtimePackage
    ├── manifest ──────────────────────────────┐
    ├── definition                            │
    └── register                              │
                                               ▼
registry/elements.manifest.json               process package
registry/electrical-elements.manifest.json    electrical package
    ├── schemaVersion
    ├── package name / version
    └── elements[]
        ├── attributes
        ├── states
        ├── parts
        ├── ports
        ├── motions
        ├── composition
        └── viewport metadata
```

`@pom4h/elements-core` exports `ELEMENTS_MANIFEST_SCHEMA_VERSION` and `createElementsManifest()`. Manifest creation rejects duplicate public identifiers and invalid custom-element tag names. Package manifests are JSON serializable and do not import browser registration code.

`bun run registry:sync` generates canonical JSON artifacts from built package manifests. `bun run registry:check` is the permanent CI drift gate: registry schema versions, manifest references, tags, examples and committed JSON artifacts must agree with the definitions.

## Two domain packages

The registry currently proves the same contract with two independent packages:

```text
@pom4h/process-elements
  pe-pump
  pe-tank
  pe-control-valve
  ...

@pom4h/electrical-elements
  ee-motor
  ee-breaker
  ee-contactor
  ee-transformer
  ee-meter
```

The electrical package required no electrical branches in `@pom4h/elements-core`. It reuses the existing attributes, derived states, parts, collections, motion primitives and topology model. `ee-breaker` is intentionally parametric: `poles="3"` resolves to six live `electrical` terminals through the same dynamic-port API used by process equipment.

## Registry Explorer

`apps/playground/registry.html` is a generic consumer of `registry.json` plus every manifest referenced by its items. It does not infer a package from `pe-*` or `ee-*`, and contains no pump/tank/motor/breaker branches.

For any listed item it provides a live native custom-element preview, exact `shadcn add` command, generated controls for string/number/boolean/enum attributes, static or live dynamic ports, semantic SVG parts, motions, viewport/state counts and responsive presentation.

The browser proof is executable:

```bash
bun run registry:demo-proof
```

Headless Chrome opens the hashed production Explorer and captures six responsive cases across both domains:

```text
docs/screenshots/registry-explorer-desktop.png                 process pump
docs/screenshots/registry-explorer-tablet.png                  process tank · 6 live ports
docs/screenshots/registry-explorer-mobile.png                  process control valve
docs/screenshots/registry-electrical-motor-desktop.png         electrical motor
docs/screenshots/registry-electrical-breaker-tablet.png        3-pole breaker · 6 live ports
docs/screenshots/registry-electrical-meter-mobile.png          electrical meter
```

## Source-ownership proof

`bun run registry:proof` proves source ownership in both domains end to end:

```text
real shadcn add
    ↓
copied process + electrical source
    ↓
consumer changes each copied label binding
    ↓
consumer browser bundle
    ↓
Chrome Shadow DOM contains P-CUSTOM + M-CUSTOM
```

The release smoke test separately packs and installs `@pom4h/elements-core`, `@pom4h/process-elements` and `@pom4h/electrical-elements` as npm tarballs. Server code imports both package manifests without DOM globals; browser code registers elements from both packages.

Together these gates cover both sides of the model:

```text
package manifests -> generic tooling across domains
registry source    -> consumer ownership and customization
```
