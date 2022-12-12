# vite-wrap-worker

> Use workers without thinking about using workers.

## How

Using Workers is not always easy to think with. This vite plugin makes it as easy as just importing your module you wont to run off thread and it just works. (On the condition the file has a '.worker.ts' extension.)

It transform your importetd file to wrap around a [Comlink](https://github.com/GoogleChromeLabs/comlink) Proxy, without braking any types.

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
	work() {
		console.log("done", globalThis);
	},
};
```

```typescript
// main.ts
import Process from "./processing/Process.worker";
await Process.work()
// done, DedicatedWorkerGlobalScope
```
