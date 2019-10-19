export class a {}; // tslint:disable-line

export const b = 1;

export function c() { return 2; };

export const d = () => 3;

const e = () => 5;

export { e };

// ts-unused-exports:disable-next-line
export const f = 1;

export default 4;
