// app/first-login.js

var Ticket = require('./models/ticket');
var specialChars = require('./special-chars');
var tags = ['Backup', 'Mail', 'Network Connectivity', 'Wi-Fi', 'Ethernet', 'LAN', 'PEBKAC']
var User = require('../app/models/user');

module.exports = {
	createWeb: function(req, res, next) {
		var d = req.body;

		var ticket = new Ticket();

		// Add user to ticket
		if (req.user.isHelper) {
			ticket.helpers.push(req.user._id);
		} else {
			ticket.requester = req.user._id;
		}

		// Check and add additional helpers
		if (d.helpers) {
			for (var i = 0; i < d.helpers.length; i++) {
				if (d.helpers[i] != req.user.pid) {
					User.findOne({'pid': d.helpers[i]}, function(err, user) {
						if (err) {
							req.flash('error', 'Internal server error!');
							return res.redirect('back');
						};

						if (user) {
							ticket.helpers.push(user._id);
						} else {
							req.flash('warning', 'User ' + d.helpers[i] + ' does not exist!');
						}
					});
				}
			}
		}

		// Check description lenght
		if (d.description) {
			if (d.description.length >= 5000) {
				req.flash('error', 'Description is too long!');
				return res.redirect('back');
			}
			for (var i = 0; i < d.description.length; i++) {
				if (specialChars.name.includes(d.description.charAt(i))) {
					req.flash('error', 'Description contains unusual characters!');
					return res.redirect('back');
				}
			}
			ticket.description = d.description;
		} else {
			req.flash('warning', 'No description provided!');
		}

		// Check tags
		if (d.tags) {
			for (var i = 0; i < d.tags.length; i++) {
				if (tags.includes(d.tags[i])) {
					req.flash('error', 'Unknown tag!');
	            	return res.redirect('back');
				}
				ticket.tags.push(d.tags[i])
			}
		}

		ticket.save(function(err) {
			if (err) {
				req.flash('error', 'Internal server error!');
				return res.redirect('back');
			}

		});

		res.send('success');
	},
	// getBeforeId: function(pid) {
	// 	return new Promise(function (fulfill, reject){
	// 		Tickets.findOne({'pid': pid}, function(err, obj) {
	// 	    	if (err)
	// 	    		reject(err);

	// 	        if (obj) {
	// 		        Tickets.find({'creationTime': pid}, function(err, obj) {
	// 			    	if (err)
	// 			    		reject(err);

	// 			        if (obj) {
				        	
	// 			        } else {
	// 			        	reject(err);
	// 			        }
	// 			    });
	// 	        } else {
	// 	        	reject(err);
	// 	        }
	// 	    });
	// 	});
	// }
}
