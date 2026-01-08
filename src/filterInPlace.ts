export const filterInPlace = <T>(xs: T[], keep: (item: T) => boolean): void => {
	let w = 0;
	for (let r = 0; r != xs.length; r++) {
		const item = xs[r]!;
		if (keep(item)) xs[w++] = item;
	}
	xs.length = w;
};
