/**
 * Maprox REST Client JS implementation
 * 2013, Maprox LLC
 */
var app = {
/**
	* Constructor
	*/
	initialize: function() {
		this.bindEvents();
		this.bindHandlers();
		this.initEnvironment();
		// check authorization
		if (!this.isAuthorized()) {
			$.mobile.changePage("#registration");
		} else {
			$.mobile.changePage("#settings");
		}
	},

/**
	* Environment initialization
	*/
	initEnvironment: function() {
		$.mobile.loader.prototype.options.text = "Loading...";
		$.mobile.loader.prototype.options.textVisible = true;
		$.mobile.loader.prototype.options.theme = "a";
		$.mobile.loader.prototype.options.html = "";
	},

/**
	* Returns true, if this device was already authorized
	*/
	isAuthorized: function() {
		return (typeof this.getDeviceKey() != "undefined");
	},

/**
	* Returns a stored device key
	*/
	getDeviceKey: function() {
		return app.storage.get("devicekey");
	},

/**
	* 
	*/
	lock: function() {
		$("body").append('<div class="modalWindow"/>');
		$.mobile.loading('show');
	},

/**
	* 
	*/
	unlock: function() {
		$.mobile.loading('hide');
		$(".modalWindow").remove();
	},

/**
	* Bind button handlers
	*/
	bindHandlers: function() {
		$('#signup').on('tap', $.proxy(this.signup, this));
	},

/**
	*
	*/
	signup: function() {
		if (this.isSigningUp) { return; }
		this.isSigningUp = true;
		this.lock();
		$.ajax({
			url: app.cfg.path + '/mon_device/create',
			dataType: 'jsonp',
			type: 'POST',
			data: {
				
			},
			success: function(json) {
				// do stuff with json (in this case an array)
				alert("Success");
			},
			error: function() {
				alert("Error");
			}
		});
		setTimeout(function() {
			app.unlock();
			app.isSigningUp = false;
		}, 2000);
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


/**
 * 
 */
app.manager = {
	
};

/**
 * Storage implementation
 */
app.storage = {
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
 * Application configuration
 */
app.cfg = {
	path: 'http://observer.localhost/'
};
