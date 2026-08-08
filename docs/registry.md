# Source registry

Elements uses a shadcn-style distribution model for concrete graphical elements: the runtime can remain a dependency, while an element's implementation is copied into the consuming project and becomes application-owned source.

## GitHub source registry

The repository root contains a standard shadcn `registry.json`. Because GitHub source registries are resolved directly by the shadcn CLI, no Elements-specific download protocol or registry server is required.

```bash
bunx shadcn@latest add Pom4H/elements/process-pump
```

The first item installs:

```text
src/elements/shared.ts
src/elements/process-pump/pump.ts
src/elements/process-pump/register.ts
```

Import the browser registration entrypoint once:

```ts
import './src/elements/process-pump/register.ts';
```

Then the project owns the implementation and can edit it directly:

```html
<pe-pump running speed="1450" value="6.2" quality="good"></pe-pump>
```

## Contract layering

`registry.json` deliberately uses the official shadcn registry schema as its outer distribution contract. Elements-specific machine metadata lives under `item.meta.elements`, which the shadcn schema explicitly permits as arbitrary metadata.

```text
shadcn registry item
├── files / targets / dependencies   distribution contract
└── meta.elements                    Elements semantic contract
    ├── schemaVersion
    ├── tagName
    ├── runtimePackage
    ├── definition
    └── register
```

The semantic section can grow to expose attributes, states, parts, ports, motions, detail, composition and viewport metadata without forking the shadcn protocol.

## Executable proof

`bun run registry:proof` proves the source-ownership model end to end:

1. creates an empty consumer project;
2. installs the local built `@pom4h/elements-core` package boundary;
3. runs the real `shadcn@latest add Pom4H/elements/process-pump#<current-ref>` command;
4. verifies the declared source files arrived in the consumer;
5. edits the copied `pump.ts`, changing its default label from `P-101` to `P-CUSTOM`;
6. bundles the consumer browser entrypoint;
7. opens it in headless Chrome;
8. fails unless `<pe-pump>` renders an SVG whose Shadow DOM contains `P-CUSTOM`.

This is intentionally stronger than a schema snapshot: it demonstrates that a registry item is installable source, is actually editable by the consumer and still runs on the Elements runtime after customization.
