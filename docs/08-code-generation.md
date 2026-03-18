# Code Generation

ScaffScript uses two constructs to define what code gets written and where:

- **`#[blockName]`**, named content blocks
- **`intg`**, maps blocks to GM asset paths

---

## Integration Blocks (`#[...]`)

A block is a named section of content written to a specific GM asset.

```ts
#[blockName]
// GML code here...
```

Blocks extend until the next `#[...]` header or end of file.

---

### Event Targeting

Use `as <eventType>` to target a specific GameMaker object event:

```ts
#[objCreate as create]
show_debug_message("create event!");

#[press_enter as keypress:keyboard_enter]
show_debug_message("F5 pressed!");

#[keydown:keyboard_f5 Event]
show_debug_message("F5 holded!");

#[coll_player as collision:objPlayer]
show_debug_message("collided with objPlayer!");
```

Format: `<eventType>[:<eventArg>]`

| Event keyword | GM Event | `eventArg` |
|---|---|---|
| `create` | Create | - |
| `destroy` | Destroy | - |
| `alarm` | Alarm | `ALARM_0` - `ALARM_11` |
| `step` | Step | `STEP`, `STEP_BEGIN`, `STEP_END` |
| `collision` | Collision | object name (e.g. `objPlayer`) |
| `keydown` / `keyboard` | Keyboard Down | key constant (e.g. `KEYBOARD_F5`) |
| `keypress` | Key Press | key constant |
| `keyrelease` | Key Release | key constant |
| `mouse` | Mouse | mouse constant |
| `draw` | Draw | `DRAW`, `DRAW_GUI`, `DRAW_BEGIN`, etc. |
| `other` | Other | other constant (e.g. `GAME_START`) |
| `cleanup` | Clean Up | - |
| `gesture` | Gesture | gesture constant (e.g. `GESTURE_TAP`) |

---

### Flags

Append flags after `--` in the block header:

```ts
#[blockName -- flag1 flag2]
#[blockName as eventType -- flag1 flag2]
```

Multiple flags are space-separated.

| Flag | Effect |
|------|--------|
| `debug` | Emptied when `debugLevel >= 1` |
| `dev` / `development` | Emptied when `production: true` |
| `prod` / `production` | Emptied when `production: false` |
| `skip` / `disabled` | Always emptied |
| `exclude` | Written to `.out/` but stripped before GM project integration |
| `<platform>` | Included only when `targetPlatform` matches |
| `!<platform>` | Excluded when `targetPlatform` matches |

```ts
#[main -- android exclude]
show_debug_message("Android only, and excluded from GM project integration!");
```

---

### Block Merging

Multiple blocks with the same name are merged, bodies concatenated with a blank line separator:

```ts
#[main]
show_debug_message("On all platforms!");

#[main -- windows]
show_debug_message("Windows only extra content!");

#[noHtml -- !html5]
show_debug_message("Anything but HTML5!");

#[noHtml -- html5]
show_debug_message("This is from HTML5!");
```

The order of merged blocks is preserved. The final output will be:

```ts
#[main]
show_debug_message("On all platforms!");
// only on Windows: show_debug_message("Extra content only on Windows!");

#[noHtml]
// only on non-HTML5: show_debug_message("Anything but HTML5!");

// only on HTML5: show_debug_message("This is from HTML5!");
```

---

## Integration Statement (`intg`)

Maps blocks to a GM asset path.

```ts
intg <target(s)> to "<path>"
```

```ts
intg * to "./path/to/asset"                    // all blocks
intg myBlock to "./path/to/asset"              // single block
intg { block1, block2 } to "./path/to/asset"   // multiple blocks
```

The path points to the target GM asset relative to the project root. Omit the `.gml` extension, ScaffScript appends it.

### Virtual Path / Folder Grouping

When the path has more than 2 segments, intermediate segments become folders in the GameMaker IDE. The last segment is the asset name.

```ts
scripts/Scripts/MyFolder/myScript
```

- Creates/modifies `myScript` script asset.
- Places it under `Scripts/MyFolder` folder in GameMaker.

---

## Example

```ts
// index.ss
intg * to "./scripts/myScript"
intg { main, objCreate, keydown:keyboard_f5 } to "./objects/Objects/oSystem"
intg { main, objCreate } to "./scripts/MyFolder/myOtherScript"

#[main]
@content method
show_debug_message("from main");

#[objCreate as create]
show_debug_message("from create event!");

#[keydown:keyboard_f5 Event]
show_debug_message("F5 pressed!");
```

Generates:
- `scripts/myScript/myScript.gml` -> all blocks.
- `objects/oSystem/Create_0.gml` -> `objCreate` block.
- `objects/oSystem/Keyboard_116.gml` -> `keydown:keyboard_f5` block.
- `./out/System/oSystem.gml` -> `main` block. It's not a valid GM event, so it won't be integrated to the GM project.
- `scripts/myOtherScript/myOtherScript.gml` -> `main` and `objCreate` blocks. 
    - If `MyFolder` folder isn't exists, create it in the GameMaker IDE, and place `myOtherScript` under it.
    - If `MyFolder` already exists, move `myOtherScript` to that folder.

---

## Output Directory

All files are staged in `.out/` first. The purpose of this directory is to serve as a preview of what will be integrated to the GM project.

Set `clearOutputDir: true` to wipe it before each run.

Set `noIntegration: true` to generate to `.out/` only without touching the GM project.

---

## Best Practices

- Use `index.ss` as your integration entry point. Put all `intg` statements and `#[...]` blocks there. It's processed last so it can access all sibling exports.
- Use  [virtual path](#virtual-path--folder-grouping) as much as possible for better GM asset organization and readability:
    ```ts
    intg * to "./scripts/Scripts/myScript"
    intg { main } to "./objects/Objects/oSystem"
    intg { utils } to "./scripts/Scripts/Utilities/myUtils"
    ```
