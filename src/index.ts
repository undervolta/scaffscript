#!/usr/bin/env bun

import { resolvePath } from "./utils";
import { getPath } from "./fs";


console.log(getPath());

const file = Bun.file(resolvePath("tests/test.gml"));
const content = await file.text();
console.log(content);

Bun.write(resolvePath("../.out/test.gml"), content);
