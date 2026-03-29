import type { ScaffConfig } from "@types";

const config: Partial<ScaffConfig> = {
	acceptAllIntegrations: false,
	clearOutputDir: true,
	debugLevel: 0,
	integrationOption: {
		isDnd: false
	},
	noBackup: false,
	noIntegration: true,
	production: false,
	path: {
		"@scr1": "./script1",
		"~scr1": "~/script1",
		"@scr/*": "./*",
		"~/*": "~/*"
	},
	source: "./tests/scripts",
	targetPlatform: "all",
	useGmAssetPath: true
};

export default config;