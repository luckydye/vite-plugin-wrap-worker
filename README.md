# vite-wrap-worker

*This is an experimental plugin, not intended for production.*

Use workers without thinking about using workers.

## How

It transforms your importetd file with an *.worker.* extension to wrap around a [Comlink](https://github.com/GoogleChromeLabs/comlink) Proxy, without braking any types.

## Example

```typescript
// vite.config.ts
import wrapWorker from "@luckydye/vite-wrap-worker";
import { defineConfig } from "vite";

export default defineConfig({
  base: "",
  plugins: [wrapWorker()],
});
```

```typescript
// Process.worker.ts
export default {
  async work() {
    console.log("done", globalThis);
  },
};
```

```typescript
// main.ts
import Process from "./Process.worker";
await Process.work()
// done, DedicatedWorkerGlobalScope
```
