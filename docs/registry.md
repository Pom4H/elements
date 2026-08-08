# Source registry

Elements uses a shadcn-style distribution model for concrete graphical elements: the runtime remains a small dependency, while an element's implementation is copied into the consuming project and becomes application-owned source.

## Install source

The repository root is a standard shadcn GitHub source registry. No Elements-specific downloader or registry server is required.

```bash
bunx shadcn@latest add Pom4H/elements/process-pump
bunx shadcn@latest add Pom4H/elements/process-tank
bunx shadcn@latest add Pom4H/elements/process-control-valve
```

A registry item copies the definition and its browser registration entrypoint into the consumer. For example, the pump installs as application-owned source:

```text
src/elements/shared.ts
src/elements/process-pump/pump.ts
src/elements/process-pump/register.ts
```

Import the browser registration entrypoint once:

```ts
import './src/elements/process-pump/register.ts';
```

Then use the native custom element directly:

```html
<pe-pump running speed="1450" value="6.2" quality="good"></pe-pump>
```

The consumer is expected to edit `pump.ts` when a project needs different geometry, parts, states, ports or motion. Source ownership is the product model, not an escape hatch.

## Contract layering

`registry.json` uses the official shadcn registry schema as its outer distribution contract. Elements semantics are a separate, versioned contract generated from server-safe definitions.

```text
shadcn registry item
├── files / targets / dependencies      distribution contract
└── meta.elements
    ├── schemaVersion
    ├── tagName
    ├── runtimePackage
    ├── manifest ───────────────┐
    ├── definition              │
    └── register                │
                                ▼
registry/elements.manifest.json
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

`bun run registry:sync` generates the canonical JSON artifact from the built server-safe `@pom4h/process-elements/manifest`. `bun run registry:check` is the permanent CI drift gate: registry item schema versions, tag references, example attributes and the committed canonical manifest must agree with the definitions.

## Registry Explorer

`apps/playground/registry.html` is a generic consumer of the registry contract. Discovery and API panels are built from `registry.json` plus `elements.manifest.json`; the Explorer contains no pump/tank/valve branches.

For any listed item it provides:

- a live native custom-element preview;
- the exact `shadcn add` command;
- generated controls for string, number, boolean and enum attributes;
- ports, semantic SVG parts and motion declarations;
- viewport, state and API counts;
- responsive desktop/tablet/mobile presentation.

Changing a generated attribute control writes directly to the live custom element. Adding another conforming registry item does not require a new element-specific Explorer UI.

The browser proof is executable:

```bash
bun run registry:demo-proof
```

Headless Chrome opens the production-bundled Explorer and captures:

```text
docs/screenshots/registry-explorer-desktop.png   process-pump · 1440×1000
docs/screenshots/registry-explorer-tablet.png    process-tank · 1024×900
docs/screenshots/registry-explorer-mobile.png    process-control-valve · 390×844
```

## Source-ownership proof

`bun run registry:proof` separately proves the shadcn ownership model end to end:

1. creates an empty consumer project;
2. installs the local built `@pom4h/elements-core` package boundary;
3. runs the real `shadcn@latest add Pom4H/elements/process-pump#<current-ref>` command;
4. verifies the declared source files arrived in the consumer;
5. edits the copied `pump.ts`, changing its default label from `P-101` to `P-CUSTOM`;
6. bundles the consumer browser entrypoint;
7. opens it in headless Chrome;
8. fails unless `<pe-pump>` renders an SVG whose Shadow DOM contains `P-CUSTOM`.

Together the two proofs cover both sides of the model:

```text
registry metadata -> generic tooling
registry source   -> consumer ownership and customization
```
