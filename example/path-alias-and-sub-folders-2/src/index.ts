import { foo2FromIndex } from "@foo2";
import { foo2Other } from "@foo2/other";
import { fooFromIndex } from "@foo/index";
import { fooOther } from "@foo/other";

export function unusedFromIndex() {}

console.log(fooFromIndex);
console.log(fooOther);

console.log(foo2FromIndex);
console.log(foo2Other);
