import { MyInterface: MyStruct } from "./script2"
import { y, z: my_z, arrow_fn } from "./script1"

include { y, z } from "@scr1"

	@content arrow_fn
show_debug_message($"y = @:y, z = {@typeof my_z}");

include { "normal.gml" } from "."
