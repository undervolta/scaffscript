import { runtime } from "./detect";
import { BunRuntime } from "./bun";
import { NodeRuntime } from "./node";

export const fsRuntime = (runtime === "bun")
	? BunRuntime
	: NodeRuntime;
