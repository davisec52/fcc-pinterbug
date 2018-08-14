const express = require("express");
const app = express();
const mongoose = require("mongoose");
const User = require("../models/users"); //Destructuring not used due to use of plugin in User model
const {Image} = require("../models/images");
const isImageUrl = require("is-image-url");


let isValidUrl = (req, res, next) => {
	console.log("testing req.body.imageUrl: ", req.body.imageUrl);
	let validImage = isImageUrl(req.body.imageUrl.toString());
	if(!validImage) {
		console.log("invalid url");
		req.body.imageUrl = "http://via.placeholder.com/350x350";
		next();
	}else {
	console.log("valid url");
	next();
	}
}

let isAuthenticated = (req, res, next) => {

	if(req.session.passport.user.toString() === req.user._id.toString() || req.user._id.toString() === req.params.id) {
		//console.log("req.session.passport.user: ", req.session.passport.user);
		//console.log("type of req.session.passport.user: ", typeof req.session.passport.user);
		console.log("Authenticated!");
		next();
	}else if(!req.params.id || req.params.id === undefined || !res.locals.currentUser){
		console.log("Not authenticated");
		res.redirect("/login");
	}
}

let processPin = (person, filterVar, arr, name, bi) => {
	let pinned = arr[0];
	pinned.user = "";
		let existingBoard = filterVar.filter(board => board.board_name === name);
		existingBoard[0].board_items.push(pinned);
		let boardItemsLeng = existingBoard[0].board_items.length;
		existingBoard[0].board_items[boardItemsLeng - 1].user = person.username;
		existingBoard[0].board_items[boardItemsLeng - 1].userId = person._id;
		existingBoard[0].board_items[boardItemsLeng - 1].imageId = pinned._id;
		existingBoard[0].board_items[boardItemsLeng - 1].boardindex = bi;
		arr.length = 0;
		console.log("existingBoard[0]: ", existingBoard[0]);
}

module.exports = {
	isValidUrl,
	isAuthenticated,
	processPin
};