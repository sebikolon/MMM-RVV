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
		tripWrapper.appendChild(spnTripWrapper);

		// Show title of module only if enabled in config
		if (self.config.showTitle !== ""){
			spnTripWrapper.className="rvvTitle";
			var currentDate = new Date();
			spnTripWrapper.textContent =
				this.config.title + " ("
				+  (currentDate.getHours() < 10 ? "0" : "") + currentDate.getHours() + ":"
				+ (currentDate.getMinutes() < 10 ? "0" : "") + currentDate.getMinutes() + ":"
				+  (currentDate.getSeconds() < 10 ? "0" : "") + currentDate.getSeconds() + ")";
		}

		// Create new table that will hold all trips in a single row
		tblTrips = document.createElement("table");
		tblTrips.className = "small";

		// Add a row for each trip
		for (var tripIdx=0; tripIdx < this.trips.length; tripIdx++){
			var curTrip = this.trips[tripIdx];

			var trTrip = document.createElement("tr");
			trTrip.className = "rvvTripRow";
			var tdTrip = document.createElement("td");
			tdTrip.className = "rvvTripCol";

			// Cell content, prefix: e.g. 'Abfahrt um 17:04h '
			if (this.config.toName !== "") {
				tdTrip.textContent =
					"Abfahrt um: "
					+ curTrip.departure
					+ "h ";
			}
			else
			{
				tdTrip.textContent =
					curTrip.direction.substr(0, this.config.displayDirectionLimit)
					//+ curTrip.direction.length > this.config.displayDirectionLimit ? "." : ""
					+ ": um "
					+ curTrip.departure + "h ";
			}

			// Cell content, postfix: e.g. '(+1)' or '(0)', having different styles applied
			var spnTripDelay = document.createElement("span");
			spnTripDelay.className = "rvvTripDelay";
			spnTripDelay.classList.add(curTrip.delay > 0 ? "rvvTripHasDelay": "rvvTripHasNoDelay");
			spnTripDelay.textContent = "(" + curTrip.delay + ")";
			tdTrip.classList.add("rvvTripText");

			tdTrip.appendChild(spnTripDelay);
			trTrip.appendChild(tdTrip);
			tblTrips.appendChild(trTrip);
		}
		tripWrapper.appendChild(tblTrips);
		wrapper.appendChild(tripWrapper);
		console.log(wrapper);
		return wrapper;
		//}
	}
});