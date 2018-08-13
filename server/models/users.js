const mongoose = require("mongoose");
const validator = require("validator");
const passportLocalMongoose = require("passport-local-mongoose");

let UserSchema = mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},

	email: {
		type: String,
		required: true,
		trim: true,
		minlenth: 6,
		unique: true,
		validate: {
			isAsync: false,
			validator: validator.isEmail,
			message: `{value} is not a valid email.`
		}
	},

	created: String,

	password: String,

	boards: {
		type: [{
			board_name: String,
			board_items: [{
				imageId: String,
				user: String,
				userId: String,
				boardindex: Number,
				itemindex: Number,
				image_url: String,
				galleryLink: String,
				title: String,
				postedBy: String,
				boardOwner: String,
				description: String
			}]
		}],
		created: String
	}
});

UserSchema.methods.changePassword = function(oldPassword, newPassword, cb) {
    if (!oldPassword || !newPassword) {
      return cb(new errors.MissingPasswordError(options.errorMessages.MissingPasswordError));
    }

    var self = this;
    let user = self;

    this.authenticate(oldPassword, function(err, authenticated) {
      if (err) { return cb(err); }

      if (!authenticated) {
        return cb(new errors.IncorrectPasswordError(options.errorMessages.IncorrectPasswordError));
      }

      self.setPassword(newPassword, function(setPasswordErr, user) {
        if (setPasswordErr) { return cb(setPasswordErr); }

        self.save(function(saveErr) {
          if (saveErr) { return cb(saveErr); }

          cb(null, user);
        });
      });
    });
  };

UserSchema.plugin(passportLocalMongoose);

//let User = mongoose.model("User", UserSchema);

module.exports = mongoose.model("User", UserSchema);