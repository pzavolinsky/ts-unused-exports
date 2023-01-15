import analyzeTsConfig from "ts-unused-exports";
import { inc } from './math';

console.log('two', inc(1));

try {
  const result = analyzeTsConfig("../simple/tsconfig.json");
  console.log(result)
} catch (e) {
  console.error(e);
}