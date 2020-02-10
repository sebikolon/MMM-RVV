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
	},
	get_minutes_with_leading_zeros: function(dt)
	{
		return (dt.getMinutes() < 10 ? "0" : "") + dt.getMinutes();
	},
	checkConstraints: function(trips, tripObj, config)
	{
		if (tripObj.direction === "Schwabenstraße" && config.fromID === 4014037){
			if ((tripObj.departure).substr(3,4) - (trips[trips.length -1].departure).substr(3,4) === 2)
			{
				trips.pop();
			}
		}
		return;
	}
};
