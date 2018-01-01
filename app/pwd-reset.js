module.exports = {
  send: function(req, res, next, User) {
    async.waterfall([
     function(done) {
       crypto.randomBytes(20, function(err, buf) {
         var token = buf.toString('hex');
         done(err, token);
       });
     },
     function(token, done) {
       User.findOne({ 'local.email': req.body.email }, function(err, user) {
         if (!user) {
           req.flash('error', 'No account with that email address exists.');
           return res.redirect('/forgot');
         }

         user.local.resetPasswordToken = token;
         user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour

         user.save(function(err) {
           done(err, token, user);
         });
       });
     },
     function(token, user, done) {
        ses.sendEmail({
            to: user.local.email,
            from: '"CSTS" <password-reset@mail.csts.ubipo.net>',
            subject: 'CSTS Password Reset',
            message: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                     'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                     '<a href="http://csts.ubipo.net/reset/' + token + '">http://csts.ubipo.net/reset/' + token + '</a>\n\n' +
                     'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        }, function (err, data, res) {
            if (err) return next(err);
            req.flash('info', 'An e-mail has been sent to ' + user.local.email + ' with further instructions.');
            console.log("Mail to " + user.local.email + ". Token is " + token);
            done(err, 'done');
        });
     }
    ], function(err) {
     if (err) return next(err);
     res.redirect('/forgot');
    });
  },

  reset: function(req, res, User) {
    async.waterfall([
      function(done) {
        User.findOne({ 'local.resetPasswordToken': req.params.token, 'local.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('msgError', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }

          user.local.password = user.generateHash(req.body.password);
          user.local.resetPasswordToken = undefined;
          user.local.resetPasswordExpires = undefined;

          user.save(function(err) {
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
      },
      function(user, done) {
        ses.sendEmail({
            to: user.local.email,
            from: '"CSTS" <password-reset@mail.csts.ubipo.net>',
            subject: 'CSTS Password Changed',
            message: 'This is a confirmation that the password for your account ' + user.local.email + ' has just been changed.\n'
        }, function(err, data, res) {
          if (err) return next(err);
          req.flash('msgSuccess', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/home');
    });
  }
};

