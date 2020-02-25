Module.register("MMM-RVV", {

	// Default module config.
	defaults: {
		updateInterval :	30 * 1000, 	// Updates data every 30 seconds
		titleText : 		"Universität Regensburg", // Module header title
		url : 				"http://www.bayern-fahrplan.de/xhr_departures_monitor?limit=25&zope_command=dm_next&nameInfo_dm=",
		logToConsole : 		false,		// Log each single trip onto the console (for debugging purposes)
		progressColor: 		"#6db64b", 	// Default color (or RGB code) of the progress bar
		maximumTripsToShow: 5,			// Max. number of trips to show
		stop_from_ID: 		4014080, 	// (Universität) // 4014037 (Graßer Weg),		// Get your stopID from: https://www.bayern-fahrplan.de/XML_COORD_REQUEST?&jsonp=jQuery17203101277124009285_1524132000786&boundingBox=&boundingBoxLU=11.953125%3A49.15297%3AWGS84%5BDD.DDDDD%5D&boundingBoxRL=12.304688%3A48.922499%3AWGS84%5BDD.DDDDD%5D&coordOutputFormat=WGS84%5BDD.DDDDD%5D&type_1=STOP&outputFormat=json&inclFilter=1&_=1524132001290
		stop_to: 			[]			// The names of the destination stops. If not set, display all destinations
	},

	start: function() {
		Log.info(this.config);
		Log.info("Starting module: " + this.name);

		this.trips = [];
		this.updateCounter = self.config.updateInterval / 1000;
		this.getTripsFromRVV();

		self = this;
		// Prevent update invertal from loading too often - set it to at least 10s
		if (self.config.updateInterval < 10 * 1000) {
			self.config.updateInterval = 10 * 1000;
		}

		setInterval(function() {
			self.getTripsFromRVV();
		}, self.config.updateInterval);
	},

	getScripts: function() {
		return [];
	},

	getStyles: function() {
		return ["rvv.css"];
	},

	getTranslations: function () {
		return {
			en: "translations/en.json",
			de: "translations/de.json"
		};
	},

	getTripsFromRVV: function() {
		this.sendSocketNotification("GET_TRIPS", {
			config: this.config
		});
	},

	socketNotificationReceived: function(notification, payload) {
		this.notification = notification;
		if (notification === "RETURN_TRIPS" || notification === "ERR_RETURN_TRIPS") {
			this.trips = payload.trips;
			this.updateDom(1000); 		// 1 sec animation delay
		}
	},

	notificationReceived: function(notification, payload, sender) {

	},

	getHeaderRow: function () {
		let tr = document.createElement("tr");

		var routeHeader = document.createElement("th");
		routeHeader.className = "hRoute";
		routeHeader.innerHTML = this.translate("ROUTE");
		tr.appendChild(routeHeader);

		var destinationHeader = document.createElement("th");
		destinationHeader.className = "hDestination";
		destinationHeader.innerHTML = this.translate("DESTINATION");
		tr.appendChild(destinationHeader);

		var departureHeader = document.createElement("th");
		departureHeader.className = "hDeparture";
		departureHeader.innerHTML = this.translate("DEPARTURE");
		tr.appendChild(departureHeader);

		return tr;
	},

	getTripRow: function(curTrip, config) {
		// New row for the trip
		let trTrip = document.createElement("tr");
		trTrip.className = "rvvTripRow";

		// Holds the route (e.g. "2")
		let tdTripRoute = document.createElement("td");
		tdTripRoute.className = "rvvTripColRoute";
		tdTripRoute.textContent = curTrip.route;

		// Holds the destination (e.g. "Burgweinting") + detail info, if available
		let tdTripDestination = document.createElement("td");
		tdTripDestination.className = "rvvTripColDestination";
		tdTripDestination.classList.add("wrapLine");
		tdTripDestination.textContent = curTrip.direction;
		if (curTrip.detailInfo > ""){
			tdTripDestination.textContent += " (" + curTrip.detailInfo + ")";
		}

		// Holds the remaining time till the bus departs (e.g. "13 Min.")
		let tdTripDeparture = document.createElement("td");
		tdTripDeparture.className = "rvvTripColDeparture";
		// Add postfix to departures >1 hour in the future
		if (curTrip.remainingMinutes >= 60) {
			tdTripDeparture.textContent = curTrip.departure + "h";
		// Add content 'now' for buses departing in [0, 1] minutes
		} else if (curTrip.remainingMinutes === 0 || curTrip.remainingMinutes === 1) {
			tdTripDeparture.textContent = this.translate("NOW");
		// Add prefix 'before' for buses already departed but having delay
		} else if (curTrip.remainingMinutes < 0) {
			tdTripDeparture.textContent = this.translate("BEFORE") + " " + Math.abs(curTrip.remainingMinutes) + " " + this.translate("MINUTES_ABBR");;
		// Add prefix 'in' for buses departing regularly
		} else {
			tdTripDeparture.textContent = "in " + curTrip.remainingMinutes + " " + this.translate("MINUTES_ABBR");
		}

		// Adds the delay: e.g. '(+1)' or '(0)' or 'Halt entfällt', having different styles applied
		var spnTripDelay = document.createElement("span");
		spnTripDelay.className = "rvvTripColDelay";
		var delayOptions = ["Halt entfällt", "Fahrt entfällt", "Fahrt fällt aus"];
		spnTripDelay.classList.add(curTrip.delay > 0 || delayOptions.includes(curTrip.delay) ? "rvvTripHasDelay": "rvvTripHasNoDelay");
		spnTripDelay.textContent = " (" + curTrip.delay + ")";
		tdTripDeparture.appendChild(spnTripDelay);

		// Put all together
		trTrip.appendChild(tdTripRoute);
		trTrip.appendChild(tdTripDestination);
		trTrip.appendChild(tdTripDeparture);

		return trTrip;
	},

	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.id = "wrapper";

		var tripWrapper = document.createElement("div");
		tripWrapper.id = "rvv-container";

		// Creates the loading bar animation wrapper
		var divReloadWrapper = document.createElement("div");
		divReloadWrapper.id = "divReloadWrapper";

		// Creates the loading bar animation
		var divReload = document.createElement("div");
		divReload.id = "divReload";
		divReload.style.animationDuration = (this.config.updateInterval / 1000) + "s";
		divReload.style.background = this.config.progressColor;
		divReloadWrapper.appendChild(divReload);
		tripWrapper.appendChild(divReloadWrapper);

		if (this.notification === "ERR_RETURN_TRIPS" || this.trips.length === 0) {
			var text = document.createElement("div");
			text.classList.add("wrapLine");
			text.classList.add("small");
			text.classList.add("dimmed");
			if (this.notification === "ERR_RETURN_TRIPS") {
				text.innerHTML = this.translate("ERROR_FETCHING_SOURCE") + " " + this.name + ". " + this.translate("PLEASE_CHECK_CONFIG") + "!";
			} else{
				text.innerHTML = this.translate("LOADING");
			}
			wrapper.appendChild(text);
			return wrapper;
		}

		var header = document.createElement("header");
		header.innerHTML = this.config.titleText;
		wrapper.appendChild(header);

		// Create new table that will hold our trip data
		tblTrips = document.createElement("table");
		tblTrips.className = "small";

		// Add the headers of the table
		tblTrips.append(this.getHeaderRow());

		for (var tripIdx=0; tripIdx < this.trips.length; tripIdx++){
			var curTrip = this.trips[tripIdx];
			var trTrip = this.getTripRow(curTrip, this.config);
			tblTrips.appendChild(trTrip);
		}
		tripWrapper.appendChild(tblTrips);
		wrapper.appendChild(tripWrapper);

		return wrapper;
	}
});