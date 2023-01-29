# Reproduction Repo - ts-unused-exports not working across path aliases

To reproduce,

```bash
pnpm i
pnpm ts-unused-exports ./tsconfig.json
```

Will report `foo` as unused, despite it [clearly being used in a `console.log()`](./src/index.ts)
