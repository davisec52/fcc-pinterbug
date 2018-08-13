console.log("twitter.js connected");
require("../.config/config")
const passport = require("passport");
const mongoose = require("mongoose");
const TwitterStrategy = require("passport-twitter").Strategy;
const User = require("../server/models/users");


passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter/callback",
    includeEmail: true
   },

   function(token, tokenSecret, profile, done) {

      let appUser = {
        username: profile.displayName,
        email: profile.emails[0].value,
      };

      User.findOne({email: appUser.email}, (err, user) => {
        if(!user || user === null || user === undefined) {
          User.create(appUser, (err, appUser) => {
            done(null, appUser);
            console.log("New user created");
          });
        }else {
          done(null, user);
        }
      });
   }

 ));

passport.serializeUser((user, done) => {
	//console.log(user);
	done(null, user._id);
});

passport.deserializeUser((id, done) => {
	User.findById(id).
		then((result) => done(null, result)).
		catch((err) => {console.log("err: ", err); throw err;});
});

/*passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});*/


module.exports = passport;
