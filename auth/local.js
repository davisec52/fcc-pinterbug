const passport = require("passport");
const LocalStrategy = require("passport-Local").Strategy;
const User = require("../server/models/users");

passport.serializeUser(function (user, fn) {
  fn(null, user);
});

passport.deserializeUser(function (id, fn) {
  User.findOne({_id: id.doc._id}, function (err, user) {
    fn(err, user);
  });
});


passport.use(new LocalStrategy(User.authenticate()));

module.exports = passport;