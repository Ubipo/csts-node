// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var configAuth = require('./auth.js');

// load up the user model
var User            = require('../app/models/user');

// expose this function to our app using module.exports
module.exports = function(passport) {

	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// used to deserialize the user
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	// =========================================================================
	// LOCAL SIGNUP ============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

	passport.use('local-signup', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true // allows us to pass back the entire request to the callback
	},
	function(req, email, password, done) {

		// asynchronous
		// User.findOne wont fire unless data is sent back
		process.nextTick(function() {

		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
		User.findOne({ 'local.email' :  email }, function(err, user) {
			// if there are any errors, return the error
			if (err)
				return done(err);

			// check to see if theres already a user with that email
			if (user) {
				return done(null, false, req.flash('error', 'That email is already taken!'));
			} else {

				// if there is no user with that email
				// create the user
				var newUser            = new User();

				newUser.firstLogin     = true;

				// set the user's local credentials
				newUser.local.email    = email;
				newUser.local.password = newUser.generateHash(password);

				// save the user
				newUser.save(function(err) {
					if (err)
						throw err;
					return done(null, newUser);
				});
			}

		});    

		});

	}));

	// =========================================================================
	// LOCAL LOGIN =============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

	passport.use('local-login', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true // allows us to pass back the entire request to the callback
	},
	function(req, email, password, done) { // callback with email and password from our form

		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
		User.findOne({ 'local.email' :  email }, function(err, user) {
			// if there are any errors, return the error before anything else
			if (err)
				return done(err);

			// if no user is found, return the message
			if (!user)
				return done(null, false, req.flash('error', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

			// if the user is found but the password is wrong
			if (!user.validPassword(password))
				return done(null, false, req.flash('error', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

			// all is well, return successful user
			return done(null, user);
		});
	}));

	// =========================================================================
	// FACEBOOK ================================================================
	// =========================================================================
	passport.use(new FacebookStrategy({
		clientID        : process.env.FACEBOOK_AUTH_ID,
		clientSecret    : process.env.FACEBOOK_AUTH_SECRET,
		callbackURL     : 'http://csts.ubipo.net/auth/facebook/callback',
		profileFields: ['id', 'emails', 'name'],
		passReqToCallback : true
	},

	// facebook will send back the token and profile
	function(req, token, refreshToken, profile, done) {

		// asynchronous
		process.nextTick(function() {

			// check if the user is already logged in
			if (!req.user) {

				// find the user in the database based on their facebook id
				User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

					// if there is an error, stop everything and return that
					// ie an error connecting to the database
					if (err)
						return done(err);

					// if the user is found, then log them in
					if (user) {

						// if there is a user id already but no token (user was linked at one point and then removed)
						// just add our token and profile information
						if (!user.facebook.token) {
							user.facebook.token = token;
							user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
							user.facebook.email = profile.emails[0].value;

							user.save(function(err) {
								if (err)
									throw err;
								return done(null, user);
							});
						}

						return done(null, user); // user found, return that user

					} else {
						// if there is no user found with that facebook id, create them
						var newUser            = new User();

						newUser.firstLogin     = true;

						// set all of the facebook information in our user model
						newUser.facebook.id    = profile.id; // set the users facebook id                   
						newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
						newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
						newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

						// save our user to the database
						newUser.save(function(err) {
							if (err)
								throw err;

							// if successful, return the new user
							return done(null, newUser);
						});
					}

				});

			} else {
				// user logged in, try to link accounts

				// check if another user with this facebook id is already in the database
				User.findOne({ 'facebook.id' : profile.id }, function(err, existingUser) {
					if (err)
						return done(err);

					// if a user is with that facebook id is found, check if it's the request's user
					if (existingUser) {
						if(req.user.id != existingUser.id) {
							console.log('Facebook account already used by other user')
							return done(null, false, req.flash('error', 'That Facebook account is already used by someone else!'));
						}
					}

					// either this is a new facebook account or it was already linked to this user, eitherway: update credentials
					var user            = req.user; // pull the user out of the session

					// update the current users facebook credentials
					user.facebook.id    = profile.id;
					user.facebook.token = token;
					user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
					user.facebook.email = profile.emails[0].value;

					// save the user
					user.save(function(err) {
						if (err)
							throw err;
						return done(null, user);
					});
				});
			}
		});
	}));


	// =========================================================================
	// GOOGLE ==================================================================
	// =========================================================================
	passport.use(new GoogleStrategy({

		clientID        : process.env.GOOGLE_AUTH_ID,
		clientSecret    : process.env.GOOGLE_AUTH_SECRET,
		callbackURL     : 'http://csts.ubipo.net/auth/google/callback',
		passReqToCallback : true
	},
	function(req, token, refreshToken, profile, done) {

		// make the code asynchronous
		// User.findOne won't fire until we have all our data back from Google
		process.nextTick(function() {
			console.log(req.user);
			// check if the user is already logged in
			if (!req.user) {

				// try to find the user based on their google id
				User.findOne({ 'google.id' : profile.id }, function(err, user) {
					if (err)
						return done(err);

					// if a user is found, log them in
					if (user) {

						// if there is a user id already but no token (user was linked at one point and then removed)
						// just add our token and profile information
						if (!user.google.token) {
							user.google.token = token;
							user.google.name  = profile.displayName;
							user.google.email = profile.emails[0].value; // pull the first email

							user.save(function(err) {
								if (err)
									throw err;
								return done(null, user);
							});
						}

						// if a user is found, log them in
						return done(null, user);
					} else {
						// if the user isnt in our database, create a new user
						var newUser          = new User();

						newUser.firstLogin     = true;

						// set all of the relevant information
						newUser.google.id    = profile.id;
						newUser.google.token = token;
						newUser.google.name  = profile.displayName;
						newUser.google.email = profile.emails[0].value; // pull the first email

						// save the user
						newUser.save(function(err) {
							if (err)
								throw err;
							return done(null, newUser);
						});
					}
				});
			} else {
				// user logged in, try to link accounts

				// check if another user with this google id is already in the database
				User.findOne({ 'google.id' : profile.id }, function(err, existingUser) {
					if (err)
						return done(err);

					// if a user is with that google id is found, check if it's the request's user
					if (existingUser) {
						if(req.user.id != existingUser.id) {
							console.log('Google account already used by other user')
							return done(null, false, req.flash('error', 'That Google account is already used by someone else!'));
						}
					}

					// either this is a new google account or it was already linked to this user, eitherway: update credentials
					var user            = req.user; // pull the user out of the session

					// update the current users google credentials
					user.google.id    = profile.id;
					user.google.token = token;
					user.google.name  = profile.displayName;
					user.google.email = profile.emails[0].value; // pull the first email

					// save the user
					user.save(function(err) {
						if (err)
							throw err;
						return done(null, user);
					});
				});
			}
		});

	}));

	// =========================================================================
	// TWITTER =================================================================
	// =========================================================================
	passport.use(new TwitterStrategy({

		consumerKey     : process.env.TWITTER_AUTH_ID,
		consumerSecret  : process.env.TWITTER_AUTH_SECRET,
		callbackURL     : 'http://csts.ubipo.net/auth/twitter/callback',
		passReqToCallback : true

	},
	function(req, token, tokenSecret, profile, done) {

	// make the code asynchronous
	// User.findOne won't fire until we have all our data back from Twitter
		process.nextTick(function() {

			// check if the user is already logged in
			if (!req.user) {

				User.findOne({ 'twitter.id' : profile.id }, function(err, user) {

					// if there is an error, stop everything and return that
					// ie an error connecting to the database
					if (err)
						return done(err);

					// if the user is found then log them in
					if (user) {

						// if there is a user id already but no token (user was linked at one point and then removed)
						// just add our token and profile information
						if (!user.facebook.token) {
							user.twitter.token       = token;
							user.twitter.username    = profile.username;
							user.twitter.displayName = profile.displayName;

							user.save(function(err) {
								if (err)
									throw err;
								return done(null, user);
							});
						}

						return done(null, user); // user found, return that user
					} else {
						// if there is no user, create them
						var newUser                 = new User();

						newUser.firstLogin     = true;

						// set all of the user data that we need
						newUser.twitter.id          = profile.id;
						newUser.twitter.token       = token;
						newUser.twitter.username    = profile.username;
						newUser.twitter.displayName = profile.displayName;

						// save our user into the database
						newUser.save(function(err) {
							if (err)
								throw err;
							return done(null, newUser);
						});
					}
				});

			} else {
				// user logged in, try to link accounts

				// check if another user with this twitter id is already in the database
				User.findOne({ 'twitter.id' : profile.id }, function(err, existingUser) {
					if (err)
						return done(err);

					// if a user is with that twitter id is found, check if it's the request's user
					if (existingUser) {
						if(req.user.id != existingUser.id) {
							console.log('Facebook account already used by other user')
							return done(null, false, req.flash('error', 'That Twitter account is already used by someone else!'));
						}
					}

					// either this is a new twitter account or it was already linked to this user, eitherway: update credentials
					var user            = req.user; // pull the user out of the session

					// update the current users twitter credentials
					user.twitter.id          = profile.id;
					user.twitter.token       = token;
					user.twitter.username    = profile.username;
					user.twitter.displayName = profile.displayName;

					// save the user
					user.save(function(err) {
						if (err)
							throw err;
						return done(null, user);
					});
				});
			}
		});
	}));
};
