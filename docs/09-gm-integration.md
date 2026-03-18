# GameMaker Integration

After generation, **ScaffScript** writes output directly into your GameMaker project, creating `.gml` files, generating `.yy` metadata for new assets, and updating your `.yyp` project file.

---

## Asset Types

### Scripts

Script assets are written to `scripts/<Name>/<Name>.gml`. If the script doesn't exist yet, **ScaffScript** also creates the `.yy` metadata file and registers it in your `.yyp`.

### Objects

Object assets are written to `objects/<Name>/`. Each event gets its own file:

```
objects/oSystem/Create_0.gml
objects/oSystem/Keyboard_116.gml
objects/oSystem/oSystem.yy
```

For new objects, **ScaffScript** creates the `.yy` with the event list. For existing objects, it appends new events without duplicating.

---

## `useGmAssetPath`

Controls whether **ScaffScript** uses the GM asset folder structure:

- `true` -> paths under `scripts/` and `objects/` are treated as GM assets; per-event file generation is active for objects
- `false` -> all output is flat script files, no `.yy` manipulation

Most projects should use `true`.

---

## Folder Registration

When creating new assets, **ScaffScript** automatically adds the necessary folder entries to your `.yyp`. Intermediate folders are created incrementally and deduplicated.

For a target like `scripts/Scripts/MyFolder/Sub/myScript`, **ScaffScript** ensures `Scripts`, `Scripts/MyFolder`, and `Scripts/MyFolder/Sub` all exist as folders in your project before adding the script resource.

---

## Backup System

Before overwriting an existing `.gml` file, **ScaffScript** reads and stores the original content as a backup (unless `noBackup: true`). This backup is used in the review step to offer a restore option.

---

## Integration Review

When `acceptAllIntegrations: false` (default), **ScaffScript** enters an interactive review loop after writing all files:

**For existing files (backup available):**

```
[INPUT]  Revert file Create_0.gml from oSystem? (y/N) ->
```

Type `y` to restore the original content.

**For new files (no backup):**

```
[INPUT]  Remove file scMyScript.gml from scMyScript? (y/N) ->
```

Type `y` to delete the file and remove it from the `.yyp`.

Set `acceptAllIntegrations: true` to skip this step entirely. Use with caution.

---

## `exclude` Flag

Blocks flagged with `-- exclude` are written during generation but stripped from the final integrated content. Use this to include content only for review purposes.

---

## Event File Naming

| Event | Filename |
|-------|----------|
| Create | `Create_0.gml` |
| Destroy | `Destroy_0.gml` |
| Step | `Step_0.gml` |
| Step Begin | `Step_1.gml` |
| Step End | `Step_2.gml` |
| Alarm 0 | `Alarm_0.gml` |
| Keyboard F5 | `Keyboard_116.gml` |
| Draw GUI | `Draw_64.gml` |
| Collision with objPlayer | `Collision_objPlayer.gml` |

---

## Supported Platforms

```
android | gxgames | html5 | ios | linux | mac
ps4 | ps5 | reddit | switch | switch2 | tvos
ubuntu | windows | xboxone | xboxseries
```

Use `all` (default) to include blocks regardless of platform. Use `!<platform>` as a block flag to exclude for a specific platform.
