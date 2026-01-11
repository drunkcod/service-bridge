import type { FnRefMap } from './ServiceBridge.js';
import type { ServiceProxy } from './ServiceProxy.js';
import type { TransferRef } from './transfer.js';
import type { AnyFn } from './types.js';

export type { Async } from './types.js';
export type { ServiceMap, ServiceBridgeBuilder, FnRef, FnRefMap, ServiceRef } from './ServiceBridge.js';
export type { ServiceBridgeProxy } from './ServiceBridgeProxy.js';

export { ServiceBridge, serviceBridgeBuilder } from './ServiceBridge.js';
export { serviceProxy, type ServiceProxy } from './ServiceProxy.js';

export { type Transfer, type Transferred, type TransferredService, transfer } from './transfer.js';

export type Service<T> = ServiceProxy<TransferRef<FnRefMap<T extends AnyFn ? Awaited<ReturnType<T>> : T>>>;
