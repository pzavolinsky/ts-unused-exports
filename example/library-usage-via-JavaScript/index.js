import analyzeTsConfig from "ts-unused-exports";

try {
  // need to navigate to reach the function:
  const result = analyzeTsConfig.default("../simple/tsconfig.json");
  console.log(result)
} catch (e) {
  console.error(e);
}