Module.register("MMM-RVV", {

	// Default module config.
	defaults: {
		updateInterval : 30 * 1000, // 30 seconds
	},

	start: function() {
		Log.info(this.config);
		Log.info("Starting module: " + this.name);

		this.trips = [];
		this.updateCounter = self.config.updateInterval / 1000;
		this.getTripsFromRVV();

		self = this;
		// Prevent update invertal from loading too often - set it to at least 10s
		if(self.config.updateInterval < 10000) {
			self.config.updateInterval = 10000;
		}
		// Set default URL
		if (self.config.url === "") {
			self.config.url = "http://www.bayern-fahrplan.de/xhr_departures_monitor?limit=20&zope_command=dm_next&nameInfo_dm=";
		}

		setInterval(function() {
			self.getTripsFromRVV();
		}, self.config.updateInterval);
	},

	// Define required scripts.
	getScripts: function() {
		return [];
	},

	getStyles: function() {
		return ["rvv.css"];
	},

	getTripsFromRVV: function() {
		//if (self.config.updateCounter === self.config.updateInterval){
		Log.info("--> RVV: Getting trips for '" + this.config.fromName + "'");
		this.sendSocketNotification("GET_TRIPS", {
			config: this.config
		});
		// }
		// else{
		// 	this.updateDom();
		// }
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "RETURN_TRIPS") {
			Log.info("--> RVV: Trip return: " + payload.trips);
			this.lastUpdate = new Date();
			this.trips = payload.trips;
			this.updateDom(2000); // 2sec animation delay
		}
	},

	notificationReceived: function(notification, payload, sender) {

	},

	// Override dom generator.
	getDom: function() {
		//console.log("getDo: " + this.updateCounter + " --- " + this.config.updateInterval / 1000);

		// if (this.updateCounter < this.config.updateInterval / 1000) {
		// 	this.updateCounter++;

		// 	console.log("updateCtr: " + this.updateCounter);

		// 	var wrapper = document.getElementById("wrapper");
		// 	var spnTimePassed = document.getElementById("RVVTimePassed");
		// 	if (spnTimePassed === null){
		// 		spnTimePassed = document.createElement("span");
		// 		spnTimePassed.id = "RVVTimePassed";
		// 		spnTimePassed.className = "rvvTitle";
		// 		if (wrapper !== null){
		// 			wrapper.appendChild(spnTimePassed);
		// 		}
		// 	}
		// 	spnTimePassed.textContent = "Time passed: " + this.updateCounter + " sec.";
		// 	return wrapper;
		// }
		// else{
		// 	this.updateCounter = 0;

		var wrapper = document.createElement("div");
		wrapper.id = "wrapper";

		var tripWrapper = document.createElement("div");
		tripWrapper.id = "rvv-container";
		var spnTripWrapper = document.createElement("span");
		spnTripWrapper.className="rvvTitle";
		var currentDate = new Date();
		spnTripWrapper.textContent =
			this.config.title + " ("
			+ currentDate.getHours() + ":"
			+ (currentDate.getMinutes() < 10 ? "0" : "") + currentDate.getMinutes() + ":"
			+ currentDate.getSeconds() + ")";
		tripWrapper.appendChild(spnTripWrapper);

		for (var tripIdx=0; tripIdx < this.trips.length; tripIdx++){
			var curTrip = this.trips[tripIdx];
			var pTrip = document.createElement("p");

			// Row content, prefix: e.g. 'um 17:04h '
			var spnTrip = document.createElement("span");

			if (this.config.toName !== "") {
				spnTrip.textContent =
					"Abfahrt um: "
					+ curTrip.departure
					+ "h ";
			} else
			{
				spnTrip.textContent =
					curTrip.direction.substr(0, this.config.displayDirectionLimit)
					//+ curTrip.direction.length > this.config.displayDirectionLimit ? "." : ""
					+ ": um "
					+ curTrip.departure + "h ";
			}

			// row content, postfix: e.g. '(+1)' or '(0)', having different styles applied
			var spnTripDelay = document.createElement("span");
			spnTripDelay.className = "rvvTripDelay";
			spnTripDelay.classList.add(curTrip.delay > 0 ? "rvvTripHasDelay": "rvvTripHasNoDelay");
			spnTripDelay.textContent = "(" + curTrip.delay + ")";

			// Add css classes
			spnTrip.classList.add("rvvTripText");
			//spnTrip.classList.add("rvvContent");

			pTrip.appendChild(spnTrip);
			pTrip.appendChild(spnTripDelay);
			tripWrapper.appendChild(pTrip);
		}
		wrapper.appendChild(tripWrapper);
		console.log(wrapper);
		return wrapper;
		//}
	}
});