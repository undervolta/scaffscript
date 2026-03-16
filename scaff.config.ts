import type { ScaffConfig } from "@types";

const config: Partial<ScaffConfig> = {
	acceptAllIntegration: false,
	clearOutputDir: true,
	debugLevel: 0,
	integrationOption: {
		isDnd: false
	},
	noBackup: false,
	noIntegration: false,
	production: false,
	path: {
		"@scr1": "./script1"
	},
	targetPlatform: "all",
	useGmAssetPath: true
};

export default config;