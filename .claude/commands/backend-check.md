---
description: Static-check the Base44 Deno backend without a deploy
allowed-tools: Bash(deno lint:*)
---
Validate the Base44 backend functions statically (they run only on Base44):

```
deno lint --rules-exclude=no-import-prefix,prefer-const base44/functions/gameEngine/entry.ts base44/functions/concurrentPlay/entry.ts
```

(`no-import-prefix` is excluded because Base44 REQUIRES inline `npm:` specifiers; `prefer-const` is excluded pending an owner edit to the monolith.)

`deno lint` catches **syntax / brace / parse errors and lint-rule violations only** — it does NOT resolve references or types, so an undefined-symbol/scope/type error will pass this check and only fail at deploy. (`deno check` would catch those, but can't resolve the `npm:` specifier here without a deno.json/node_modules setup.)

Report any problems found, and remind me that behavior still needs a Base44 deploy smoke-test.
