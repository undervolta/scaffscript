import { MyInterface: MyStruct } from "./script2"

include { y, z: my_z } from "./script1"

show_debug_message($"y = {@:y}, z = {@typeof z}");
