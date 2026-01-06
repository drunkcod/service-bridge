export const BridgeCommand = Object.freeze({ call: 0, config: 1, close: -1 });
export type BridgeCommand = (typeof BridgeCommand)[keyof typeof BridgeCommand];
