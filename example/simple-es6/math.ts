export function unused1(x: number) { return x + 100; }

// ts-unused-exports:disable-next-line
export function unusedButDisabled(x: number) { return x + 2; }

export default (x: number) => x + 1;
