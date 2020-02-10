/* Magic Mirror
 * Node Helper: MMM-RVV
 *
 * By sebikolon https://github.com/sebikolon
 * MIT Licensed.
 */

module.exports = {
	// Prints the input text to the browser console, if enabled in the config.
	// This might help you to check, if MMM-RVV is fetching the correct data
	printToConsole : function(textToLog, config){
		if (config.logToConsole === true) {
			console.log(textToLog);
		}
	}
};
