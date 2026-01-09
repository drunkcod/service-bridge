# ⚡️ service-bridge

**Selective In-Process Microservices for Node.js.**

`service-bridge` allows you to offload heavy, blocking, or sensitive logic into Worker Threads while maintaining a clean, type-safe, and asynchronous API. It treats your internal modules like microservices—without the network latency, Docker overhead, or deployment complexity.

---

## ⚠️ Brutal Honesty (Read Before Using)

This is version **0.0.1**. It is an alpha-stage experiment in architectural patterns.
While the core implementation is high-performance and type-safe, project infrastructure is currently minimal.

### The "Catch":

1.  **Hard Boundaries:** This is not a "threading library" where you share memory. It is a communication bridge.
2.  **Serialization Only:** You **cannot** pass functions, class instances (with methods), or DOM-like objects across the bridge. If it doesn't survive a `JSON.stringify` (or more accurately, the Structured Clone Algorithm), it won't survive the bridge.
3.  **No Closures:** The configuration logic is serialized and re-evaluated in the worker. It cannot "capture" variables from your main thread's scope.
4.  **Async or Bust:** Every call to a service becomes a `Promise`. If your code isn't ready for `async/await` everywhere, this library will be painful.
5.  **Debugging is Harder:** Attaching a debugger to worker threads requires extra steps. Error stacks are "stitched" back together by the library, but it's not as seamless as single-threaded code.

---

## 🏗 Core Philosophy: Monolith-First

We believe in building clean monoliths that are _ready_ to become microservices.

- **Isolation:** Services are forced to be pure.
- **Offloading:** Move `bcrypt`, `jsonwebtoken`, image processing, or heavy math out of the primary event loop.
- **Scale-up:** Saturate all CPU cores on a single instance before paying for a distributed system.

---

## 🚀 Quick Start

### 1. Define your Service

```typescript
// services/math.ts
export const add = (a: number, b: number) => a + b;
```

### 2. Wire the Bridge

```typescript
// startServices.ts
import { serviceBridgeBuilder } from '@drunkcod/service-bridge';

//this ensures type safe dynamic import resolution.
type Registry = {
  './services/math.js': typeof import('./services/math.js');
};

export const start = () =>
  serviceBridgeBuilder<Registry>().createProxy(async (bridge) => {
    const math = await bridge.import('./services/math.js');
    return {
      add: bridge.add('/math/add', math.add),
    };
  });
```

### 3. Use the Proxy

```typescript
const { services, close } = await start();
const result = await services.add(40, 2); // 42 (executed in a worker)
```

---

## ⚡️ High Performance: Transferables

If you need to move large `ArrayBuffer`s or `MessagePort`s without copying memory, use the `transfer` helper. This uses **Nominal Typing** to ensure you don't accidentally copy data.

```typescript
import { transfer } from '@drunkcod/service-bridge';

// On the caller side:
await services.process(transfer(myLargeBuffer));

// On the service side:
export const process = (buf: Transferred<ArrayBuffer>) => {
  // buf is moved, not copied.
};
```

---

## 🤖 For AI Assistants (Cursor/Windsurf/Copilot)

When assisting with this repository:

1.  **Pattern:** "In-Process Microservices". Put CPU intensive or secondary services into`services/`.
2.  **Contracts:** Services must return plain data (structured clone algorithm compatible) and be transport-agnostic.
3.  **Transfers:** Use `transfer(value)` for `MessagePort` or `ArrayBuffer` arguments.
4.  **Wiring:** Use `serviceBridgeBuilder` with a explicit `ServiceRegistry` type for full autocomplete.

---

## License

MIT. Built by Tobbe Gyllebring.
