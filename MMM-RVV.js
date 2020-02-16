Module.register("MMM-RVV", {

	// Default module config.
	defaults: {
		updateInterval : 30 * 1000, // 30 seconds
		titleText: "Universität Regensburg",
		url : "http://www.bayern-fahrplan.de/xhr_departures_monitor?limit=25&zope_command=dm_next&nameInfo_dm=",
		logToConsole : false,		// Log each single trip onto the console (for debugging purposes)
		progressColor: "#6db64b", 			// Default color (or RGB code) of the progress bar
		wrapDestination: true,
		maximumTripsToShow: 5,		// Max. number of trips to show
		maxTitleLength: 12,			// Set a limit for the number of trips to be displayed
		stop_from_ID: 4014080, 		// (Universität) // 4014037 (Graßer Weg),		// Get your stopID from: https://www.bayern-fahrplan.de/XML_COORD_REQUEST?&jsonp=jQuery17203101277124009285_1524132000786&boundingBox=&boundingBoxLU=11.953125%3A49.15297%3AWGS84%5BDD.DDDDD%5D&boundingBoxRL=12.304688%3A48.922499%3AWGS84%5BDD.DDDDD%5D&coordOutputFormat=WGS84%5BDD.DDDDD%5D&type_1=STOP&outputFormat=json&inclFilter=1&_=1524132001290
		stop_to: []					// The names of the destination stops. If not set, display all destinations
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
		if (notification === "RETURN_TRIPS") {
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

	getRemainingMinutes: function(sDeparture) {
		if (sDeparture.length != 5){
			return sDeparture;
		}
		let dtNow = new Date();
		let dtGiven = new Date(
			dtNow.getFullYear(),
			dtNow.getMonth(),
			dtNow.getDate(),
			sDeparture.substr(0,2),
			sDeparture.substr(3,2),
			dtNow.getSeconds());

		let diff = (dtGiven.getTime() - dtNow.getTime()) / 1000;
		diff /= 60;
		return Math.abs(Math.round(diff));
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
		if (config.wrapDestination === true) {
			tdTripDestination.classList.add("wrapLine");
		}
		tdTripDestination.textContent = curTrip.direction;
		if (curTrip.detailInfo > ""){
			tdTripDestination.textContent += " (" + curTrip.detailInfo + ")";
		}

		// Holds the remaining time till the bus departs (e.g. "13 Min.")
		let tdTripDeparture = document.createElement("td");
		tdTripDeparture.className = "rvvTripColDeparture";
		let remainingMinutes = this.getRemainingMinutes(curTrip.departure);
		if (remainingMinutes >= 60) {
			tdTripDeparture.textContent = //this.translate("AT") + " " +
			curTrip.departure + "h";
		} else if (remainingMinutes === 0) {
			tdTripDeparture.textContent = this.translate("NOW");
		} else {
			tdTripDeparture.textContent = "in " + remainingMinutes + " " + this.translate("MINUTES_ABBR");
		}

		// Adds the delay: e.g. '(+1)' or '(0)', having different styles applied
		var spnTripDelay = document.createElement("span");
		spnTripDelay.className = "rvvTripColDelay";
		spnTripDelay.classList.add(curTrip.delay > 0 ? "rvvTripHasDelay": "rvvTripHasNoDelay");
		spnTripDelay.textContent = " (" + curTrip.delay + ")";
		tdTripDeparture.appendChild(spnTripDelay);

		// Put all together
		trTrip.appendChild(tdTripRoute);
		trTrip.appendChild(tdTripDestination);
		trTrip.appendChild(tdTripDeparture);

		return trTrip;
	},

	padWithZeros: function(n) {
		return n < 10 ? "0" + n: n;
	},

	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.id = "wrapper";

		var tripWrapper = document.createElement("div");
		tripWrapper.id = "rvv-container";

		var divReloadWrapper = document.createElement("div");
		divReloadWrapper.id = "divReloadWrapper";
		divReloadWrapper.style.width = wrapper.width - 50;

		var divReload = document.createElement("div");
		divReload.id = "divReload";
		divReload.style.animationDuration = (this.config.updateInterval / 1000) + "s";
		divReload.style.background = this.config.progressColor;
		divReloadWrapper.appendChild(divReload);
		tripWrapper.appendChild(divReloadWrapper);

		if (!this.trips) {
			var text = document.createElement("div");
			text.innerHTML = this.translate("LOADING");
			text.className = "small dimmed";
			wrapper.appendChild(text);
			return wrapper;
		}

		var header = document.createElement("header");
		header.innerHTML = this.config.titleText; // +  lastUpdate;
		wrapper.appendChild(header);

		//tripWrapper.appendChild(spnTripWrapper);

		// Create new table that will hold all trips in a single row
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