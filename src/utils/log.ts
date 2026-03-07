export const log = {
	/**
	 * Debug log
	 * @param msg Message to log
	 */
	debug: (msg: string) => console.log('\x1b[90m[DEBUG]\x1b[0m ', msg),

	/**
	 * Info log
	 * @param msg Message to log
	 */
	info: (msg: string) => console.log('\x1b[36m[INFO]\x1b[0m  ', msg),
	
	/**
	 * Warning log
	 * @param msg Message to log
	 */
	warn: (msg: string) => console.log('\x1b[33m[WARN]\x1b[0m  ', msg),

	/**
	 * Error log
	 * @param msg Message to log
	 */
	error: (msg: string) => console.log('\x1b[31m[ERROR]\x1b[0m ', msg),
};
