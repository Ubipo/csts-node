// app/first-login.js

var specialChars = require('./special-chars');

module.exports = {
	handle: function(req, res, next) {
		var d = req.body

		// Check name lenght
		if (d.nameFirst.length > 30 || d.nameLast.length > 30) {
			req.flash('error', 'Name is too long!');
			return res.redirect('back');
		}

		// Check for unusual characters in names
		for (var i = 0, len = d.nameFirst.length; i < len; i++) {
			if (specialChars.name.includes(d.nameFirst.charAt(i))) {
				req.flash('error', 'First name contains unusual characters!');
				return res.redirect('back');
			}
		}

		for (var i = 0, len = d.nameLast.length; i < len; i++) {
			if (specialChars.name.includes(d.nameLast.charAt(i))) {
				req.flash('error', 'Last name contains unusual characters!');
            	return res.redirect('back');
			}
		}

		// Check home location
		try {
			var home = JSON.parse(d.home);
		} catch (e) {
			req.flash('error', 'Invalid home location!');
			return res.redirect('back');
		}

		if (!(home.lat <= 90 && home.lat >= -90) || !(home.lng <= 180 && home.lng >= -180)) {
			req.flash('error', 'Invalid home location!');
			return res.redirect('back');
		}


		// Check transport modes if user is a helper
		if (d.helper) {
			try {
				var transportModes = JSON.parse(d.transport);
			} catch (e) {
				req.flash('error', 'Invalid transport type!');
				return res.redirect('back');
			}
			
			if (typeof transportModes.bike == "undefined" || typeof transportModes.car == "undefined" || typeof transportModes.public == "undefined") {
				req.flash('error', 'Invalid transport type!');
	            return res.redirect('back');
			}
		}

		var user = req.user;

		user.name.first = d.nameFirst;
		user.name.last = d.nameLast;
		user.type = Boolean(d.helper);
		user.home = home;
		user.transportModes = {
			bike: transportModes.bike,
	        car: transportModes.car,
	        public: transportModes.public
		}

		user.firstLogin = false;

		user.save(function(err) {
			if (err) {
				req.flash('error', 'Internal server error!');
				return res.redirect('back');
				throw err;
			}
		});

		return res.redirect(d.redirectUrl);
	}
}
