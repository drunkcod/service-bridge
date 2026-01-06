export class SlotBuffer<T> {
	readonly #data: (T | undefined)[];
	readonly #gen: Uint32Array;
	readonly #freeSlots: Uint32Array;
	#nextFreeSlot: number;
	#capacity: number;

	constructor(capacity: number = 1024) {
		this.#gen = new Uint32Array(capacity);
		this.#freeSlots = new Uint32Array(capacity);
		this.#data = new Array<T>(capacity);
		this.#nextFreeSlot = 0;
		this.#capacity = capacity;

		for (let i = 0; i != capacity; ++i) this.#freeSlots[i] = i;
	}

	acquire(value: T) {
		if (this.#nextFreeSlot == this.#capacity) throw new Error('Capacity exceeded: No free worker slots.');
		const i = this.#freeSlots[this.#nextFreeSlot++];
		this.#data[i] = value;

		return (BigInt(++this.#gen[i]) << 32n) | BigInt(i);
	}

	release(slot: bigint): T | undefined {
		const gen = Number(slot >> 32n);
		const i = Number(BigInt.asUintN(32, slot));

		if (this.#gen[i] !== gen || i >= this.#capacity) return undefined;
		const r = this.#data[i];
		this.#data[i] = undefined;
		this.#freeSlots[--this.#nextFreeSlot] = i;
		return r as T;
	}
}
