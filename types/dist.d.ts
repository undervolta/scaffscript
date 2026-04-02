export type ScaffConfig = {
	/**
     * accept all generated files to be integrated without manual confirmation (default = false)
     */
    acceptAllIntegrations: boolean;		
    
    /**
     * clear the output directory before generating source code (default = false)
     */
	clearOutputDir: boolean;						
	
	/**
     * starting value for the counter special value (default = 1)
     */
	counterStart: number;							
	
	/**
     * debug level (default = 0, 0 = no debug, 1 = basic debug, 2 = verbose debug)
     */
	debugLevel: 0 | 1 | 2;							
	
	/**
     * integration options
     */
	integrationOption: ScaffIntegrationOptions;
	
	/**
     * don't backup the original files before integration (default = false)
     */
	noBackup: boolean;								
	
	/**
     * don't integrate the files to GM project (default = false)
     */
	noIntegration: boolean;							
	
	/**
     * what to do when something is not found (default = "error")
     */
	onNotFound: "error" | "ignore";					
	
	/**
     * path aliases (default = {})
     */
	path: Record<string, string>;					
	
	/**
     * whether the script is running in production mode (default = false)
     */
	production: boolean;
	
	/**
     * source directory (default = "./src")
     */
	source: string;
	
	/**
     * tab type to use when generating source code (default = "1t")
     */
	tabType: "1t" | "2s" | "4s";					
	
	/**
     * target platform for the generated code (default = "all"). only used for tree-shaking purpose
     */
	targetPlatform: ScaffIntegrationTargetPlatform;	
	
	/**
     * whether to use GM asset path when integrating files (default = false). asset path: `scripts` and `objects`
     */
	useGmAssetPath: boolean;						
};

type ScaffIntegrationOptions = Partial<{
	isDnd: boolean;
}>;

type ScaffIntegrationTargetPlatform =
	| "all" 
	| "android"
	| "gxgames"
	| "html5"
	| "ios"
	| "linux"
	| "mac"
	| "ps4"
	| "ps5"
	| "reddit"
	| "switch"
	| "switch2"
	| "tvos"
	| "ubuntu"
	| "windows"
	| "xboxone"
	| "xboxseries"
;
