import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");

/**
 * Read a repo file as text.
 * @param {string} relPath path relative to the repository root
 */
export function readRepoFile(relPath) {
  return readFileSync(resolve(REPO_ROOT, relPath), "utf8");
}

/**
 * Extract a top-level `const NAME = { ... };` (or `[ ... ]`) object/array
 * literal from JS/TS source text and evaluate it to a real value.
 *
 * The backend functions under base44/functions are Deno modules that
 * cannot be imported into a Node/Vitest process (Deno globals, `npm:` imports,
 * no exports). But the rules tables inside them are pure data literals, so we
 * lift them out textually and compare against the frontend `src/lib` mirrors —
 * this is what enforces CLAUDE.md's "one critical invariant" mechanically.
 *
 * Only pure-data literals are supported (numbers, strings, booleans, null,
 * nested objects/arrays). A brace matcher that skips string bodies and
 * line/block comments finds the literal's bounds.
 *
 * @param {string} source full file text
 * @param {string} name   the const identifier to extract
 * @returns {any} the evaluated literal
 */
export function extractConst(source, name) {
  const declRe = new RegExp(`\\bconst\\s+${name}\\s*=\\s*`, "g");
  const m = declRe.exec(source);
  if (!m) throw new Error(`const ${name} not found`);

  let i = m.index + m[0].length;
  const open = source[i];
  if (open !== "{" && open !== "[") {
    throw new Error(`const ${name} is not an object/array literal (starts with '${open}')`);
  }
  const close = open === "{" ? "}" : "]";

  let depth = 0;
  let inString = null; // the active quote char, or null
  let end = -1;
  for (; i < source.length; i++) {
    const c = source[i];
    const prev = source[i - 1];

    if (inString) {
      if (c === inString && prev !== "\\") inString = null;
      continue;
    }
    // entering a string
    if (c === '"' || c === "'" || c === "`") { inString = c; continue; }
    // skip line comments
    if (c === "/" && source[i + 1] === "/") {
      const nl = source.indexOf("\n", i);
      i = nl === -1 ? source.length : nl;
      continue;
    }
    // skip block comments
    if (c === "/" && source[i + 1] === "*") {
      const stop = source.indexOf("*/", i + 2);
      i = stop === -1 ? source.length : stop + 1;
      continue;
    }
    if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) throw new Error(`unterminated literal for const ${name}`);

  const literal = source.slice(m.index + m[0].length, end + 1);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${literal});`)();
}
