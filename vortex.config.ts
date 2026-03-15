import type { VortexConfig } from "@types";

const config: Partial<VortexConfig> = {
	acceptAllIntegration: false,
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