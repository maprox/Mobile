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
	},

/**
	* Environment initialization
	*/
	initEnvironment: function() {
		$.mobile.loader.prototype.options.text = "Loading...";
		$.mobile.loader.prototype.options.textVisible = true;
		$.mobile.loader.prototype.options.theme = "a";
		$.mobile.loader.prototype.options.html = "";
		// ajax error handling
		$.ajaxSetup({
			error: function(xhr){
				var msg = 'Request Status: ' + xhr.status +
					' Status Text: ' + xhr.statusText +
					' ' + xhr.responseText;
				console.warn(mgs);
			}
		});
		// check authorization
		$.mobile.changePage(!this.isAuthorized() ?
			"#registration" : "#settings");
	},

/**
	* Returns true, if this device was already authorized
	*/
	isAuthorized: function() {
		return !!this.getDeviceKey();
	},

/**
	* Returns a stored device key
	*/
	getDeviceKey: function() {
		return app.storage.get("devicekey");
	},

/**
	* Sets devicekey value
	* @param {String} value Device_key value
	*/
	setDeviceKey: function(value) {
		app.storage.set('devicekey', value);
	},

/**
	* Locks desktop while make ajax request
	* @return {Boolean} False if already locked
	*/
	lock: function() {
		if (!app.isLocked) {
			$("body").append('<div class="modalWindow"/>');
			$.mobile.loading('show');
			app.isLocked = true;
		}
		return app.isLocked;
	},

/**
	* Unlocks desktop
	*/
	unlock: function() {
		$.mobile.loading('hide');
		$(".modalWindow").remove();
		app.isLocked = false;
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
		if (!this.lock()) { return; }

		// make ajax request
		$.ajax({
			url: app.cfg.path + '/mon_device/create',
			dataType: 'jsonp',
			type: 'POST',
			data: app.getSignupParams(),
			success: function(answer) {
				// unlock application
				app.unlock();
				// 
				console.log('Got the answer: ', answer);
				if (!answer) {
					return app.setSignupError('Wrong response from server');
				}
				if (answer.success) {
					app.setDeviceKey(answer.device_key);
					$.mobile.changePage("#settings");
				} else {
					var errorMessage = 'Unknown server error';
					if (answer.errors) {
						var error = answer.errors[0];
						if (error.params && error.params.length) {
							errorMessage = error.params[0];
						}
					}
					return app.setSignupError(errorMessage);
				}
			},
			error: function() {
				// unlock application
				app.unlock();
				// 
				app.setSignupError('Unknown server error');
			}
		});
	},

/**
	* Shows signup error
	* @param {String} message
	*/
	setSignupError: function(message) {
		if (!message) {
			// hide message
			$('#registration .errorBlock').hide();
			return;
		}
		$('#registration .errorBlock').show();
		$('#registration .errorBlock').html(message);
	},

/**
	* Returns a json object of params, wich would be send to the maprox server
	* @return {Object}
	*/
	getSignupParams: function() {
		// required params
		var shareKey = $('#share_key').val();
		var params = {
			uid: app.getDeviceUid(),
			"share_key": shareKey
		};
		// optional parameters
		var name = $('#devicename').val();
		if (name) {
			params.name = name;
		}
		var note = app.getDeviceInfo();
		if (note) {
			params.note = note;
		}
		//return params;
		console.log(params);
		return {};
	},

/**
	* Returns the device uid
	* @return {String}
	*/
	getDeviceUid: function() {
		if (typeof(device) == "undefined") {
			return 'DeviceObjectIsNotFound';
		}
		return device.uuid;
	},

/**
	* Returns available the device information
	* @return {String}
	*/
	getDeviceInfo: function() {
		if (typeof(device) == "undefined") {
			return null;
		}
		return 'Device Name: ' + device.name + '<br />' + 
			'Device PhoneGap: ' + device.phonegap + '<br />' + 
			'Device Platform: ' + device.platform + '<br />' + 
			'Device UUID: ' + device.uuid + '<br />' + 
			'Device Version: '  + device.version  + '<br />';
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
		if (typeof(device) != "undefined") {
			$('#devicename').val(device.name);
		}
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
	path: 'https://observer.maprox.net/'
};
