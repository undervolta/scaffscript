export interface RuntimeFS {
	/**
	 * Read the file as text
	 * @param path Path to the file
	 * @returns File content
	 */
	readText(path: string): Promise<string>;

	/**
	 * Write the file with the given data
	 * @param path Path to the file
	 * @param data Data to write
	 */
	writeText(path: string, data: string): Promise<void>;

	/**
	 * Delete the file
	 * @param path Path to the file
	 */
	delete(path: string): Promise<void>;

	/**
	 * Prompt the user for input
	 * @param message Message to display
	 * @returns User input
	 */
	prompt(message: string): Promise<string>;
}
