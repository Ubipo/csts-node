// app/routes.js

var pwdReset = require('./pwd-reset');
var geocode = require('./geocode');
var firstLogin = require('./first-login');
var ticket = require('./ticket-methods');
const url = require('url');

// load up the user model
var User = require('../app/models/user');

module.exports = function(app, passport) {
    app.get('/egg.js', function(req, res) {
        res.sendFile('egg.js', { root: __dirname })
    })

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs',  {
            user: req.user,
            msgError: req.flash('error'),
            msgInfo: req.flash('info'),
            msgSuccess: req.flash('msgSuccess')  
        });
    });

    app.get('/home', isLoggedIn, function(req, res) {
        res.render('home.ejs',  {
            user: req.user,
            msgError: req.flash('error'),
            msgInfo: req.flash('info'),
            msgSuccess: req.flash('msgSuccess')  
        });
    });

    app.get('/geocode', function(req, res) {
        geocode.coordinates(req.query.address, function(e) {
            res.json(e);
        });
    });

    // =====================================
    // FIRST LOGIN =========================
    // =====================================
    // First login
    app.get('/first-login', isLoggedIn, function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('first-login.ejs', {
            msgError: req.flash('error'),
            msgInfo: req.flash('info'),
            msgSuccess: req.flash('success')
        }); 
    });

    // process first login form
    app.post('/first-login', isLoggedIn, function(req, res, next) {firstLogin.handle(req, res, next)});


    app.post('/ticket', isLoggedIn, function(req, res, next) {
        console.log('Ticket!')
        ticket.createWeb(req, res, next)
    });


    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form,
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', {
            msgError: req.flash('error'),
            msgInfo: req.flash('info'),
            msgSuccess: req.flash('success')
        }); 
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/home', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // FORGOT ==============================
    // =====================================
    // show the forgot form
    app.get('/forgot', function(req, res) {
        res.render('forgot', {
            user: req.user,
            msgError: req.flash('error'),
            msgInfo: req.flash('info')  
        });
    });

    // process the forgot form
    app.post('/forgot', function(req, res, next) {pwdReset.send(req, res, next, User)});

    // show the reset form
    app.get('/reset/:token', function(req, res) {
      User.findOne({ 'local.resetPasswordToken': req.params.token, 'local.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/forgot');
        }
        res.render('reset', {
            user: req.user,
            msgError: req.flash('msgError'),
            msgInfo: req.flash('msgInfo'),
            msgSuccess: req.flash('msgSuccess')
        });
      });
    });

    // process the reset form
    app.post('/reset/:token', function(req, res) {pwdReset.reset(req, res, User)});

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', {
            msgError: req.flash('error'),
            msgInfo: req.flash('info'),
            msgSuccess: req.flash('success')
        });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email'] }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/',
                failureFlash : true
            })
    );

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
                successRedirect : '/home',
                failureRedirect : '/',
                failureFlash : true
        })
    );

    // =====================================
    // TWITTER ROUTES ======================
    // =====================================
    // route for twitter authentication and login
    app.get('/auth/twitter', passport.authenticate('twitter'));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect : '/home',
            failureRedirect : '/',
            failureFlash : true
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user, // get the user out of session and pass to template
            msgError: req.flash('error'),
            msgInfo: req.flash('info'),
            msgSuccess: req.flash('success') 
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
    // =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/home', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/home',
                failureRedirect : '/home',
                failureFlash : true
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect : '/home',
                failureRedirect : '/home',
                failureFlash : true
            }));

    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/home',
                failureRedirect : '/home',
                failureFlash : true
            })
        );

    // =============================================================================
    // UNLINK ACCOUNTS =============================================================
    // =============================================================================
    // used to unlink accounts. for social accounts, just remove the token
    // for local account, remove email and password
    // user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/home');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/home');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
           res.redirect('/home');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
           res.redirect('/home');
        });
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // is user authenticated in session?
    if (req.isAuthenticated()) {
        // has user has run through first time setup?
        if (req.user.firstLogin && url.parse(req.url).pathname != '/first-login') {
            res.render('first-login.ejs', {
                msgError: req.flash('error'),
                msgInfo: req.flash('info'),
                msgSuccess: req.flash('success'),
                redirectUrl: req.url,
            });
        } else {
            return next();
        }
    } else {
        // if they aren't redirect them to the home page
        res.redirect('/');
    }
}
