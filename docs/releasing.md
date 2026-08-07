# Releasing Elements

The repository publishes two public packages in dependency order:

1. `@pom4h/elements-core`
2. `@pom4h/process-elements`

`process-elements` depends on the released core package by semver, so core must be available before process-elements is published.

## Release checks

From a clean checkout:

```bash
bun install
bun run check
bun run release:check
```

`release:check` builds the workspace, creates real npm tarballs for both packages, installs those tarballs into an empty consumer with npm, verifies that the process manifest imports without DOM globals, and bundles the browser registration entrypoint from the installed package.

CI runs the same packaging smoke test after the normal build/test job.

## Publish

Confirm that both package versions are the intended release version and that the working tree is clean. Authenticate npm with an account that can publish the `@pom4h` scope, then publish in dependency order:

```bash
npm publish ./packages/core --access public
npm publish ./packages/process-elements --access public
```

Both package manifests also declare `publishConfig.access = public` so an accidental private scoped publish is not the default.

After both publishes are visible from the registry, create the matching repository tag and GitHub release. For `0.1.0`:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Do not create the tag before both packages have published successfully: the tag represents a consumable release, not merely a source snapshot.

## What the release contract guarantees

- package consumers never depend on `workspace:*`
- definitions and manifests are importable in server environments without registering custom elements
- browser registration stays isolated in explicit `/register` entrypoints
- tarballs contain built public artifacts rather than source-only workspace assumptions

The manifest schema itself is still pre-1.0 and is tracked separately in #11.
