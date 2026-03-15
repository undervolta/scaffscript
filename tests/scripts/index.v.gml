include { y, z, STRING, method } from "./script1"
import * from "./script1"

//intg * to "./tests/Vortex-GML/scripts/MyFolder/Sub/scMyNewScript"
intg * to "./tests/Vortex-GML/scripts/MyFolder/scMyScript"
//intg { main, objCreate, coll_player } to "./tests/Vortex-GML/objects/Objects/oSystem"
//intg { objCreate } to "./tests/Vortex-GML/objects/Objects/Sub/oPlayer2"

#[main -- test]
/**
 * Version: @version
 * This is a JSDoc comment. Created at @today.
 * Line: @line. File: "@file". Counter: @counter.
 * 
 * @param x The first parameter.
 * @param y The second parameter.
 * @returns The sum of x and y.
 */
@content method

show_debug_message($"y = @:y, z = @valueof z, STRING = {@nameof STRING}");

var inst = new MyClass("John", 20);
inst.print();

#[main -- android, test]
show_debug_message("Hello, from main event (android)!");
@content STRING

#[objCreate as create -- test]
show_debug_message("Hello, from oSystem create event!");

#[keydown:keyboard_f5 Event]
show_debug_message("Hello, from other block!");

#[coll_player as collision:oPlayer]
show_debug_message("Hello, from collision - oPlayer event!");
