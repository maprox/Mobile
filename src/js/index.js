/**
 * Maprox REST Client JS implementation
 * 2013, Maprox LLC
 */

/**
 * Application configuration
 */
var app = {
	cfg: {
		path: 'https://observer.maprox.net/',
		checkLocationPeriod: 20000, // 20 sec
		sendDataPeriod: 60000, // 1 minute
		accuracyLimit: 150, // 150 meters,
		maximumPositionAge: 600000 // 10 minutes
	}
};

/**
 * Main application
 */
extend(app, {
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
				console.error('Request Status: ' + xhr.status +
					' Status Text: ' + xhr.statusText +
					' ' + xhr.responseText);
			}
		});
	},

/**
	* Bind button handlers
	*/
	bindHandlers: function() {
		var locationTracker = new app.LocationTrackerLooper();
		var serverSender = new app.ServerSenderLooper();
		$('#signup').on('tap', $.proxy(this.signup, this));
		$('#tracking').on('change', function() {
			locationTracker.setActive($('#tracking').val());
		});
		// startup page start
		$('#startup').live('pageshow', function() {
			// if user is not authorised - show registration page
			// otherwise - settings page
			$.mobile.changePage(app.isAuthorized() ?
				"#settings" : "#registration");
		});
		// settings page start
		$('#settings').live('pageshow', function() {
			// updates slider value
			var sliderValue = locationTracker.isEnabled() ? 1 : 0;
			$('#tracking').val(sliderValue).slider("refresh");
			// start tracking if it is enabled
			if (locationTracker.isEnabled()) {
				locationTracker.start();
			}
			// always start server sender "thread"
			serverSender.start();
		});
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
	* Signup procedure
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
					$.mobile.changePage('#settings');
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
		return params;
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
		if (typeof(device) == "undefined") { return null; }
		return 'Device Name: ' + device.name + '\n' + 
			'Device PhoneGap: ' + device.phonegap + '\n' + 
			'Device Platform: ' + device.platform + '\n' + 
			'Device UUID: ' + device.uuid + '\n' + 
			'Device Version: '  + device.version  + '\n';
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
		if (typeof(device) == "undefined") { return; }
		$('#devicename').val(device.name);
	}
});

/**
 * Abstract looper class
 */
app.Looper = Class.extend({
/**
	* LocalStorage id to store last status of looper
	*/
	storageId: 'undefinedLooperValue',

/**
	* Looper name (to show messages in console)
	*/
	name: 'Undefined looper',

/**
	* Period
	*/
	period: 1000, // 1 sec

/**
	* @constructor
	*//*
	init: function() {
		console.log('Init');
	},*/

/**
	* Starts or stops looper
	* @param {Boolean} value True to start looping
	*/
	setActive: function(value) {
		var me = this;
		if (!me.executeFunctionId) {
			console.log(me.name + ' is started.');
			me.executeFunctionId = setInterval(function() {
				me.execute.call(me);
			}, me.period);
			me.execute();
		} else {
			clearInterval(me.executeFunctionId);
			me.executeFunctionId = null;
			console.log(me.name + ' is stopped.');
		}
		app.storage.set(this.storageId, me.executeFunctionId ? 1 : 0);
	},

/**
	* Starts sending data
	*/
	start: function() {
		this.setActive(true);
	},

/**
	* Stops sending data
	*/
	stop: function() {
		this.setActive(false);
	},

/**
	* Returns false if tracking is disabled
	*/
	isActive: function() {
		return !!this.executeFunctionId;
	},

/**
	* Returns false if looper execution is disabled
	*/
	isEnabled: function() {
		return (app.storage.get(this.storageId) != 0);
	},

/**
	* Main loop
	*/
	execute: function() {
		console.log('Method "execute" of looper is not implemented!');
	}
});

/**
 * Application manager
 */
app.LocationTrackerLooper = app.Looper.extend({
	storageId: 'locationTrackerValue',
	name: 'Location tracker',
	period: app.cfg.checkLocationPeriod,

/**
	* Receives and sends current location
	*/
	execute: function() {
		if (this.isCheckingLocation) { return; }
		var me = this;
		me.isCheckingLocation = true;
		me.getCurrentLocation(function(result) {
			me.isCheckingLocation = false;
			if (!result.success) { return; }
			// store packet
			var packets = app.storage.get('locationPackets');
			if (!packets) {
				packets = '[]';
			}
			packets = JSON.parse(packets);
			// let's check if the last packet equals to the current
			/* TODO
			var lastPacket = null;
			if (packets.length > 0) {
				lastPacket = packets[packets.length - 1];
			}*/
			packets.push({
				latitude: result.data.coords.latitude,
				longitude: result.data.coords.longitude,
				altitude: result.data.coords.altitude,
				azimuth: result.data.coords.heading,
				accuracy: result.data.coords.accuracy,
				speed: result.data.coords.speed,
				time: result.data.timestamp
			});
			app.storage.set('locationPackets', JSON.stringify(packets));
			console.log('Location stored. Packets count: ' + packets.length);
		});
	},

/**
	* Returns current location.
	* The function makes two attempts. First attempt is done with
	* option enableHighAccuracy set to true - to enable use of GPS data.
	* If there is a timeout during location retrieving, then second
	* request is called with enableHighAccuracy set to false, to get
	* cellular (or wifi) position
	* @param {Function} fn Callback function
	* @return {Object} 
	*/
	getCurrentLocation: function(fn) {
		if (typeof(navigator) == "undefined") { return; }
		if (typeof(navigator.geolocation) == "undefined") { return; }
		var me = this;
		// ----------------------------------------------
		// Success callback
		//
		var successCallback = function(position) {
			// success
			if (position.coords.accuracy >= app.cfg.accuracyLimit) {
				fn.call(me, {
					success: false,
					error: {
						code: 2, // POSITION_UNAVAILABLE
						message: 'Accuracy is too low: ' +
							position.coords.accuracy
					}
				});
			} else {
				fn.call(me, {
					success: true,
					data: position
				});
			}
		};
		// ----------------------------------------------
		// Error callback
		//
		var errorCallback = function(error) {
			var msg = "Can't get device location. Error = ";
			if (error.code == error.PERMISSION_DENIED)
				msg += "PERMISSION_DENIED";
			else if (error.code == error.POSITION_UNAVAILABLE)
				msg += "POSITION_UNAVAILABLE";
			else if (error.code == error.TIMEOUT)
				msg += "TIMEOUT";
			msg += ", msg = " + error.message;
			console.log(msg);
			fn.call(me, {
				success: false,
				error: {
					code: error.code,
					message: error.message
				}
			});
		};
		// ----------------------------------------------
		navigator.geolocation.getCurrentPosition(
			successCallback,
			function(error) {
				if (error.code == error.TIMEOUT) {
					// Attempt to get GPS loc timed out after 5 seconds, 
					// try low accuracy location
					navigator.geolocation.getCurrentPosition(
						successCallback,
						errorCallback, {
							maximumAge: app.cfg.maximumPositionAge,
							timeout: 10000, // 10 seconds
							enableHighAccuracy: false
						});
				} else {
					errorCallback(error);
				}
			}, {
				maximumAge: app.cfg.maximumPositionAge,
				timeout: 5000, // 5 seconds
				enableHighAccuracy: true
			});
	}
});

/**
 * Sender manager
 */
app.ServerSenderLooper = app.Looper.extend({
	storageId: 'serverSenderValue',
	name: 'Sender',
	period: app.cfg.sendDataPeriod,
	execute: function() {
		console.log('Next step!');
		var me = this;
		var packets = app.storage.get('locationPackets');
		app.storage.unset('locationPackets');
		if (!packets) {
			packets = '[]';
		}
		packets = JSON.parse(packets);
		if (packets.length > 0) {
			for (var i = 0; i < packets.length; i++) {
				packets[i].device_key = app.getDeviceKey();
				packets[i].uid = app.getDeviceUid();
			}
			// let's send packets to the server
			// make ajax request
			$.ajax({
				url: app.cfg.path + '/mon_packet/create',
				dataType: 'jsonp',
				type: 'POST',
				data: {
					list: packets
				},
				success: function(answer) {
					// unlock application
					me.unlock();
					// 
					console.log('Got the answer: ', answer);
				},
				error: function() {
					// unlock application
					me.unlock();
					// 
					console.error('Unknown server error');
				}
			});
		}
	}
});

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