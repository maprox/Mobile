/**
 * Maprox REST Client JS implementation
 * 2013, Maprox LLC
 */
var app = {

	storage: {
		get: function(id) {
			if (typeof(window.localStorage) != "undefined") {
				return window.localStorage[id];
			}
		},
		set: function(id, value) {
			if (typeof(window.localStorage) != "undefined") {
				window.localStorage[id] = value;
			}
		},
		unset: function(id) {
			if (typeof(window.localStorage) != "undefined") {
				window.localStorage.removeItem(id);
			}
		}
	};

/**
	* Application Constructor
	*/
	initialize: function() {
		this.bindEvents();
		// check authorization
		if (!this.isAuthorized()) {
			$.mobile.changePage("#registration");
		} else {
			$.mobile.changePage("#settings");
		}
	},

/**
	*
	*/
	isAuthorized: function() {
		return (typeof this.getDeviceKey() != "undefined");
	},

/**
	*
	*/
	getDeviceKey: function() {
		return window.localStorage["devicekey"];
	},

/**
	* Bind Event Listeners
	*
	* Bind any events that are required on startup. Common events are:
	* 'load', 'deviceready', 'offline', and 'online'.
	*/
	bindEvents: function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},

/**
	* deviceready Event Handler
	*
	* The scope of 'this' is the event. In order to call the 'receivedEvent'
	* function, we must explicity call 'app.receivedEvent(...);'
	*/
	onDeviceReady: function() {
		app.receivedEvent('deviceready');
	},

/*
	* Update DOM on a Received Event
	*/
	receivedEvent: function(id) {
		console.log('Received Event: ' + id);
	}
};