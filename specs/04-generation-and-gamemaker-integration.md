# Generation and GameMaker Integration

## 1. Generation Inputs

The generation phase operates on files in `fileGroup.generate`, meaning `.ss` files that contain at least one `intg ... to ...` statement.

Before file emission, [`src/generator/extract.ts`](../src/generator/extract.ts) parses:

1. Integration blocks in the form `#[name] ...`
2. Integration mapping statements in the form `intg target to "path"`

## 2. Integration Block Model

Each parsed block becomes `ScaffIntegrationBlock`, which carries:

1. The block name
2. Its processed body
3. Event metadata when the block targets a GameMaker event
4. Flags

Blocks with the same name are merged by concatenating processed bodies.

## 3. Event Resolution

GameMaker event mapping is centralized in `getEventFile()` inside [`src/generator/extract.ts`](../src/generator/extract.ts) using constants from [`types/gm-event.ts`](../types/gm-event.ts).

Supported event categories include:

1. Create / Destroy
2. Alarm
3. Step
4. Collision
5. Keyboard / KeyPress / KeyRelease
6. Mouse
7. Other / Async
8. Draw
9. CleanUp
10. Gesture

Event handling differences matter:

1. Some events do not need a numeric subtype.
2. Some require one.
3. Collision uses a dynamic object reference string instead of a fixed numeric enum.

## 4. Integration Flags and Filtering

Block flags influence whether content survives into output:

1. `debug`
2. `dev` / `development`
3. `prod` / `production`
4. `skip` / `disabled`
5. `exclude`
6. platform flags such as `windows`, `html5`, or `!windows`

Filtering is applied before output is grouped into integration targets.

The current model is simple but useful:

1. Unsupported or invalid event/target references can abort or warn based on config.
2. Platform filtering is single-target oriented and assumes one active platform in config.

## 5. `.out/` Generation Rules

[`src/generator/write.ts`](../src/generator/write.ts) writes generated content into `.out/` and also prepares a `ScaffIntegrationStore` used by the integration step.

There are two main output modes:

1. Script resources
2. Object/event resources

### 5.1 Script Resources

For script-style targets:

1. All target block bodies are concatenated.
2. A single `.gml` file is emitted under `.out/`.
3. Integration metadata is prepared so the file can be written into `scripts/<name>/<name>.gml` in the GameMaker project.

### 5.2 Object/Event Resources

When `useGmAssetPath` is enabled and the target path resolves under `objects`:

1. Non-event content may still be emitted as a regular `.gml` body without integrating it to GameMaker.
2. Event blocks are split into per-event `.gml` files.
3. Metadata records the expected GameMaker object event file path and event identity.

This split matters because GameMaker object resources do not map cleanly to a single free-form source file once events are involved.

## 6. Backup and Review Flow

During generation, if `noBackup` is false and the target GameMaker file already exists:

1. The original target file is read.
2. Backup content is stored in memory in the integration summary.

Later, during integration, that backup is used to offer a manual revert prompt when `acceptAllIntegrations` is false.

## 7. GameMaker Resource Creation

[`src/generator/gm-asset.ts`](../src/generator/gm-asset.ts) handles creation and removal of GameMaker resources.

Key responsibilities:

1. Create `.yy` files for scripts and objects when missing.
2. Add object event declarations to existing `.yy` files when needed.
3. Remove generated resources when the user declines integration.
4. Update the `.yyp` project manifest with folder and resource entries.

## 8. JSON Handling Caveat

GameMaker metadata is not parsed with a strict serializer-first pipeline. Instead:

1. Trailing commas are stripped manually.
2. Some files are parsed as JSON.
3. Some files are modified by line-based string insertion/removal.

This works for current assumptions, but contributors should know it is structurally fragile. Formatting changes in GameMaker metadata could break some of the line-search logic.

## 9. Integration Writeback Flow

[`src/integration/integrate.ts`](../src/integration/integrate.ts) performs integration in batches of 10:

1. Normalize and validate the `.yyp` path.
2. Read the GameMaker project metadata.
3. For each generated file:
4. Create missing resources if necessary.
5. Remove excluded body fragments.
6. Write final content into the project file path.
7. Track newly added folders and resources.
8. Update the `.yyp` manifest after writeback.

If `acceptAllIntegrations` is `false`, the tool then prompts the user to review each integrated result:

1. Existing files can be reverted from backup.
2. New files can be removed.
3. Removed resources are also deleted from the `.yyp` manifest.

## 10. Safety and Limitations

This subsystem has the highest side-effect risk in the repository. Contributors should watch for:

1. Path correctness when mapping generated output to GameMaker resource folders.
2. Accidental duplication of resource entries in `.yyp`.
3. Event duplication logic for objects.
4. Differences between new resources and modifications to existing resources.
5. Prompt-driven flows that are awkward to test automatically.

One more honest note: this layer is doing filesystem writes, project metadata edits, and rollback UX in one place. It works, but it is fairly coupled. If the project grows, splitting planning, file emission, and manifest mutation into separate stages would make maintenance way less cursed.
