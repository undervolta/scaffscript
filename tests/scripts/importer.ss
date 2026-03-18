import { MyExtType2: MyStruct, MyClass } from "./script2"
import { y, z: my_z, arrow_fn } from "./script1"

include { y, z } from "@scr1"

@content arrow_fn
show_debug_message($"y = @:y, z = {@typeof my_z}");

var my_obj = @use MyStruct {
	name: "John",
	age: 20,
	extra: "Hello",
	other: some_var,
}

// @content MyClass

include { "normal.gml" } from "."
