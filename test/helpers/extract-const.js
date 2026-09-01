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

// Pure array-reshaping methods a declaration may chain onto its literal. The
// list is an explicit allowlist: anything else fails loudly rather than being
// silently truncated (a truncated extraction reads as "the data drifted", which
// is exactly the wrong diagnosis).
const CHAIN_ALLOWED = new Set(["map", "flatMap", "flat", "filter", "slice", "concat", "reverse"]);

// Advance past whitespace and //-line / block comments. Returns the new index.
function skipTrivia(source, i) {
  for (;;) {
    while (i < source.length && /\s/.test(source[i])) i++;
    if (source[i] === "/" && source[i + 1] === "/") {
      const nl = source.indexOf("\n", i);
      i = nl === -1 ? source.length : nl + 1;
      continue;
    }
    if (source[i] === "/" && source[i + 1] === "*") {
      const stop = source.indexOf("*/", i + 2);
      i = stop === -1 ? source.length : stop + 2;
      continue;
    }
    return i;
  }
}

/**
 * Walk a balanced bracket group starting at `start` (which must point at
 * `(`, `[` or `{`) and return the index of the bracket that closes it.
 * String bodies and both comment forms are skipped. Parentheses are counted
 * as well as braces/brackets, because chained arrow-function bodies contain
 * them.
 */
function scanBalanced(source, start) {
  let depth = 0;
  let inString = null; // the active quote char, or null
  for (let i = start; i < source.length; i++) {
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
    if (c === "{" || c === "[" || c === "(") depth++;
    else if (c === "}" || c === "]" || c === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error("unterminated literal");
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
 * A trailing chain of allowlisted pure array transforms (see CHAIN_ALLOWED) is
 * ALSO consumed and EVALUATED, so a compactly-encoded table such as
 *
 *     const NODES = [['a', 1], ['b', 2]].map(([id, n]) => ({ id, n }));
 *
 * yields the same value the backend module has at runtime, not the raw
 * source-level encoding. Note that this means the transform callback is
 * executed: it must be self-contained, since the evaluation has no access to
 * the module's scope (referencing a module-scope identifier throws
 * ReferenceError — by design, loudly). Any un-allowlisted chained method is a
 * hard error rather than a silent truncation.
 *
 * @param {string} source full file text
 * @param {string} name   the const identifier to extract
 * @returns {any} the evaluated literal (post-transform, if chained)
 */
export function extractConst(source, name) {
  const declRe = new RegExp(`\\bconst\\s+${name}\\s*=\\s*`, "g");
  const m = declRe.exec(source);
  if (!m) throw new Error(`const ${name} not found`);

  const litStart = m.index + m[0].length;
  const open = source[litStart];
  if (open !== "{" && open !== "[") {
    throw new Error(`const ${name} is not an object/array literal (starts with '${open}')`);
  }

  let end;
  try {
    end = scanBalanced(source, litStart);
  } catch {
    throw new Error(`unterminated literal for const ${name}`);
  }

  // Consume a trailing chain of allowlisted pure array transforms, so the
  // extracted value equals the module's runtime value.
  let j = end + 1;
  for (;;) {
    j = skipTrivia(source, j);
    if (source[j] !== ".") break;
    j = skipTrivia(source, j + 1);
    const nameStart = j;
    while (j < source.length && /[A-Za-z0-9_$]/.test(source[j])) j++;
    const method = source.slice(nameStart, j);
    if (!method) throw new Error(`const ${name}: malformed chain after '.'`);
    if (!CHAIN_ALLOWED.has(method)) {
      throw new Error(`const ${name}: unsupported chained method .${method}()`);
    }
    const k = skipTrivia(source, j);
    if (source[k] !== "(") throw new Error(`const ${name}: .${method} is not a call`);
    try {
      end = scanBalanced(source, k);
    } catch {
      throw new Error(`unterminated literal for const ${name}`);
    }
    j = end + 1;
  }

  const expr = source.slice(litStart, end + 1);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expr});`)();
}
