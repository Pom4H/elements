# @pom4h/electrical-elements

A deliberately small second-domain package for Elements. It uses the same runtime, manifest, port, detail and motion contracts as process automation without adding electrical branches to core.

```ts
import '@pom4h/electrical-elements/register';
```

```html
<ee-motor running speed="1450" load="72" current="12.4" quality="good"></ee-motor>
<ee-breaker poles="3" closed current="42.1" rating="63"></ee-breaker>
```

The package manifest is server-safe:

```ts
import { electricalElementsManifest } from '@pom4h/electrical-elements/manifest';
```

Initial reference set: motor, breaker, contactor, transformer and power meter. `ee-breaker` deliberately varies its live port topology with `poles`, proving the existing dynamic port contract outside process automation.
