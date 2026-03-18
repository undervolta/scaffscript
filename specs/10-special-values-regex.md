# Special Values & Regex Definitions

## Sources: `src/parser/special-value.ts`, `src/parser/regex.ts`

---

## Special Value Processing — `parseSpecialValues(file, counter)`

Runs during the grouping phase, immediately after a `.ss` file is read. Two steps:

### Step 1: Strip Comments

```ts
const matchComment = [...res.matchAll(commentRegex)];
for (const match of matchComment) {
  res = res.replace(match[0], "");
}
```

`commentRegex = /\/\/[^\n]*|\/\*(?!\*)[\s\S]*?\*\//g`

Note the `(?!\*)` negative lookahead. This excludes `/** ... */` JSDoc-style comments from stripping. JSDoc blocks pass through to the output as-is.

**Design rationale:** Strip comments first so that any directives like `@version` or `@counter` inside a comment don't get expanded. JSDoc is preserved because it's valid output in GML scripts.

### Step 2: Expand Special Values

```ts
const specialValueRegex = /@(?<cmd>now|today|version|file|line|counter)/g
```

Iterates over all matches and replaces in-place. The file string is rebuilt per match (not via a single `replaceAll`). This is important for `@line` which needs to locate the match's line number in the **original** content:

```ts
case "line":
  res = res.replace(match[0]!, String(countSubstring(res.slice(0, match.index), '\n') + 1));
  break;
```

---

## Counter Object

```ts
const counter = { count: config.counterStart };
```

Passed by reference into `parseSpecialValues()`. Mutations persist across all files. After the function returns, `counter.count` is updated:
```ts
counter.count = newCounter;
```

---

## Regex Reference (`src/parser/regex.ts`)

All regexes used across the parser are defined here centrally. Key ones:

### `modControlRegex`

```ts
/(?<cmd>export|import|include)\s+(?<mod>\*|\{[^}]+\}|[A-Za-z0-9_]+)\s+(?<src>from)\s+(?<path>["'][^"']+["'])\s*;?/g
```

Matches all three module control commands. `mod` captures wildcard, brace-wrapped list, or single identifier.

**Limitation:** The brace content `[^}]+` does not handle nested braces or quoted strings within the mod list. Module names with special characters will fail to match.

### `implRegex`

```ts
/impl\s+(?<name>[\w+]+)\s+\{\s+(?<body>[.\s\S]+?)\}/g
```

Note `[\w+]+` in the name group. This accidentally allows `+` characters in class names. Likely intended to be `[\w]+` or just `\w+`.

### `intgRegex`

```ts
/intg\s+(?<targets>\*|\{[^}]+\}|[A-Za-z0-9_]+)\s+to\s+(?<path>["'][^"']+["'])\s*;?/g
```

### `intgBlockRegex`

```ts
/#\[(?<n>[^\]]+)\](?<body>[\s\S]*?(?=\n?#\[[^\]]+\]|$))/g
```

Non-greedy body capture, anchored to next `#[` or end-of-string. A `#[` inside a GML string in the block body will prematurely terminate capture.

### `contentModRegex`

```ts
/@(?<cmd>content|valueof|typeof|nameof)\s+(?<mod>[A-Za-z0-9_]+)/g
```

Matches all four directive forms. Module name is alphanumeric + underscore only, hyphenated or dotted names are not supported.

### `useModRegex`

```ts
/@use\s+(?<mod>[A-Za-z0-9_]+)\s+(?<body>\{[.\s\S]+?\})/g
```

Non-greedy body. Stops at the first `}`. Nested structs inside `@use` bodies will cause incorrect capture.

### `fnHeaderRegex` / `arrowFnHeaderRegex`

Used for function and arrow function detection in export resolution and `impl` processing. Both use named groups `name` and `params`.

### `tabRegex`

Three variants for tab type detection (`1t`, `2s`, `4s`). Used by `getTabLevels()` to compute per-line indentation depths for `@content` re-indentation.

---

## `getTabLevels(str, tabType)`

Splits `str` by the appropriate tab regex, maps each match to a count of tab units. Returns an array indexed by line (one entry per line in `str`). Used to re-indent injected content to match the surrounding context.

**Note:** Returns counts for all lines including blank lines. Callers must handle the case where a blank line's tab count is 0.
