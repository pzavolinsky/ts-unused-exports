import { calculations } from "utils";

export function unused1(x: number) { return calculations.sum(x, 1); }

// ts-unused-exports:disable-next-line
export function unused2ButDisabled(x: number) { return x + 2; }

export default (x: number) => x + 1;
