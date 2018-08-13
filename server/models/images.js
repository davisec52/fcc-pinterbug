const mongoose = require("mongoose");

let imageSchema = new mongoose.Schema({
	user: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	boardindex: Number,
	itemindex: Number,
	image_url: String,
	galleryLink: String,
	postedBy : String,
	title: String,
	description: String,
	created: String
});

let Image = mongoose.model("Image", imageSchema);

module.exports ={
	Image
};