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

	addTrip: function(tripObj, trips, config){
		// Check special conditions
		if (trips.length > 0) {

			// Case 1: Remove the first of 2 duplicated trips for route "Graßer Weg" => "Schwabenstraße"
			if (tripObj.direction === "Schwabenstraße" && config.fromID === 4014037){
				if ((tripObj.departure).substr(3,2) - (trips[trips.length -1].departure).substr(3,2) === 2)
				{
					trips.pop();
				}
			}
			// Case 2: tbd.
			// Case 3: tbd.
			// Case 4: tbd.
			// ...
		}

		// Check, if trip limit is already reached
		if (trips.length >= config.maximumTripsToShow) {
			this.printToConsole("MMM-RVV could fetch more trips, but they were limited to " + config.maximumTripsToShow + " trips. Aborting the fetch.", config);
			limitReached = true;
		}
		else {
			trips.push(tripObj);
		}
		return trips;
	}
};
