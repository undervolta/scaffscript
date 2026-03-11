import type { VortexConfig } from "@types";

const config: Partial<VortexConfig> = {
	acceptAllIntegration: false,
	debugLevel: 1,
	noBackup: false,
	noIntegration: false,
	production: false,
	path: {
		"@scr1": "./script1"
	}
};

export default config;