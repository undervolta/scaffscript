# Special Values

Special values are compile-time tokens replaced with actual values during processing. They use the `@` prefix followed by a keyword.

Only processed in `.ss` files, not in `.gml` files.
Expressions inside comments are **not** expanded (JSDoc comments are preserved).

---

## Reference

### `@now`
Current UTC datetime in ISO 8601 format.

```
@now  ->  2025-03-15T08:42:00.000Z
```

---

### `@today`
Current UTC date only.

```
@today  ->  2025-03-15
```

---

### `@version`
The `version` field from **ScaffScript**'s own `package.json`.

```
@version  ->  0.1.2
```

---

### `@file`
Name of the current file, without the `.ss` extension, wrapped in double quotes.

```
@file  ->  "script1"
```

---

### `@line`
Line number (1-based) of the line where `@line` appears.

```
@line  ->  7
```

---

### `@counter`
Current counter value, then increments by 1. Starts at `counterStart` from config (default: `1`). Counter is **global across all files** in a run.

```ts
// First occurrence
show_debug_message(@counter);   
// become: show_debug_message(1);

// Second occurrence (same or different file)
show_debug_message(@counter);   
// become: show_debug_message(2);
```

---

## Example

```ts
#[main]
/**
 * ScaffScript Version: @version
 * Created at @today.
 * Line: @line. File: @file. Counter: @counter.
 */
show_debug_message("hello");
```

Output:

```gml
/**
 * ScaffScript Version: 0.1.2
 * Created at 2025-03-15.
 * Line: 4. File: "index". Counter: 1.
 */
show_debug_message("hello");
```
