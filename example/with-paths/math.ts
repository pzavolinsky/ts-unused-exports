import { calculations } from "utils";

export function add1(x: number) { return calculations.sum(x, 1); }

// ts-unused-exports:disable-next-line
export function add2(x: number) { return x + 2; }

export default (x: number) => x + 1;
