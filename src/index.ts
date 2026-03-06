import { resolvePath } from "./utils/path";

console.log("Hello via Bun!");

const file = Bun.file(resolvePath("../test/test.gml"));
const content = await file.text();
console.log(content);

Bun.write(resolvePath("../.out/test.gml"), content);
