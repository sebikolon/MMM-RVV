var request = require("request");
var NodeHelper = require("node_helper");
var cheerio = require("cheerio");
var RVVHelper = require("./RVVHelper.js");

module.exports = NodeHelper.create({

	start: function() {
		console.log("Starting node helper: " + this.name);
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;
		if (notification === "GET_TRIPS") {
			var url = payload.config.url + payload.config.stop_from_ID;

			request(url, function (error, response, body) {
				var trips = [];
				// Return on error
				if (error || (response.statusCode !== 200)) {
					if (error){
						RVVHelper.printToConsole("\n" + error, payload.config);
					} else{
						RVVHelper.printToConsole("\nResponse Statuscode: " + response.statusCode, payload.config);
					}
					self.sendSocketNotification("ERR_RETURN_TRIPS", {
						trips : trips
					});
					return;
				}

				var $ = cheerio.load(body);

				var trpCnt = 1;
				var limitReached = false;
				$(".trip").each(function() {
					if (limitReached === true) {
						return;
					}
					// We store 5 properties of a trip
					var tripObj = {direction: "", detailInfo: "", delay: "", departure: "", route: ""};
					var tripData = $(this);

					RVVHelper.printToConsole("\nTrip #" + trpCnt, payload.config);
					trpCnt++;

					// Set defaults
					tripObj.delay = "0";
					tripObj.detailInfo = "";
					tripObj.departure = "00:00";
					tripObj.direction = "";
					tripObj.route = "tbd.";

					// Get 'delay' or 'nodelay' class objects and parse it as delay of the bus (e.g. +2 minutes)
					var tripDelay = tripData.find(".delay");
					if (tripDelay.length > 0){
						tripObj.delay = tripDelay.text().trim();
					}
					else {
						tripDelay = tripData.find(".nodelay");
						tripObj.delay = "0";
					}
					RVVHelper.printToConsole("Delay: " + tripObj.delay, payload.config);

					// If there was no object found, the 'delay' is 0
					if (tripDelay.length > 0) {
						tripObj.departure = tripDelay.parent().children().remove().end().text().trim();
					} else {
						tripObj.departure = tripData.find("span").first().text().trim();
					}
					RVVHelper.printToConsole("Departure: " + tripObj.departure, payload.config);

					let tdCnt = 0;
					$(tripData.find("td")).each(function(){
						tdCnt++;
						if (!$(this).hasClass("icon")){
							// Direction, e.g. 'Klinikum'
							if (tdCnt === 3 && $(this).text().trim() != ""){
								tripObj.direction = $(this).text().trim();
								RVVHelper.printToConsole("Direction: " + tripObj.direction, payload.config);
							}
							// Additional information, e.g. 'Bstg. A'
							if (tdCnt === 4 && $(this).text().trim() != ""){
								tripObj.detailInfo = $(this).text().trim();
								RVVHelper.printToConsole("Add. information: " + tripObj.detailInfo, payload.config);
							}
						} else {
							// Route, e.g. '2'
							if ($(this).find("a").first().text().trim() != ""){
								tripObj.route = $(this).find("a").first().text().trim();
								RVVHelper.printToConsole("Route: " + tripObj.route, payload.config);
							}
						}

					});

					if (payload.config.stop_to.length === 0) {
						trips = RVVHelper.addTrip(tripObj, trips, payload.config);
					}
					else {
						// Iterate over destinations
						for(var i = 0; i < payload.config.stop_to.length; i++)
						{
							if (tripObj.direction === payload.config.stop_to[i])
							{
								trips = RVVHelper.addTrip(tripObj, trips, payload.config);
							}
						}
					}
				});

				// Return trips to requester
				self.sendSocketNotification("RETURN_TRIPS" + payload.config.stop_from_ID, {
					trips : trips
				});

			});
			return;
		}
	},
});
