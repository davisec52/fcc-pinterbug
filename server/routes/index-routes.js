require("../../.config/config");
const express = require("express");
const app = express();
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const passport = require("passport");
const router = express.Router();
const mongoose = require("mongoose");
const request = require("request");
const User = require("../models/users"); //Destructuring not used due to use of plugin in User model
const {Image} = require("../models/images");
const querystring = require("querystring");
const url = require("url");
const isImageUrl = require("is-image-url");
let passportTwitter = require("../../auth/twitter");
const {isValidUrl, isLoggedIn, processPin} = require("../helpers/auxiliary");

let linkArr = [];
let imagesArr = [];

/* Authentication, register, login, and logout routes */

router.get("/login", (req, res, next) => {
	res.render("login");
});

router.get("/register", (req, res, next) => {
	res.render("register");
});

router.get("/logout", (req, res) => {
	req.logout();
	console.log("logout successful");
	res.redirect("/login");
});

//Registration using locally stored username, email and password
router.post("/user-register", (req, res, next) => {
	let timestamp = new Date;
	let newUser = new User({
		username: req.body.username,
		email: req.body.email,
		created: timestamp
	});

	User.register(newUser, req.body.password, function(err, user) {
		if(err) {
			console.log("err: ", err);
			return res.render("register", {
				user: null
			});
		}
		passport.authenticate("local")(req, res, function() {
			console.log("User successfully registered");
			res.status(200).redirect("/");
		});
	});
});

//login using locally stored email, username, and password
router.post("/login", passport.authenticate("local", {failureRedirect: "/login"}), (req, res, next) => {
	console.log("Login successful");
	res.redirect("/");
});

//Social registration/authentication with Twitter
router.get("/auth/twitter", passportTwitter.authenticate("twitter"));

router.get("/auth/twitter/callback", passportTwitter.authenticate("twitter", {/*successRedirect: "/",*/ failureRedirect: "/login"}), function(req, res) {
	console.log("Twitter registration/authentication complete");
	//Do other stuff
	res.redirect("/");
});

router.get("/change-password", (req, res) => {
	res.render("change-password", {
		user: req.user
	});
});

router.post("/change", (req, res) =>{
	console.log("req.body: ", req.body);
	req.user.changePassword(req.body.oldpw, req.body.newpw, function(err) {
		if(err) {
			console.log("err: ", err);
			throw err;
		}else {
			console.log("password changed");

			req.logout();
			console.log("logout after pw change successful");
			res.redirect("/login");
		}
	});
	
});

/* End authentication routes */

//Resolves favicon error
router.get('/favicon.ico', (req, res) => {console.log("no favicon"); res.status(204);});

router.post("/img-selection/:id/:query", isLoggedIn, (req, res) => {
	console.log("req.body: ", req.body);
	let q = querystring.parse(req.params.query);
	let i = q.index;
	let imageData = linkArr[i];
	console.log("imageData: ", imageData);
	let timestamp = new Date;
	let boardName;
	//let itemindex;

	if(req.body.selection === "base" && req.body.boardname === "") {
		return res.redirect("/dashboard/" + req.params.id + "/" + "board=error");
	}

	let newImage = new Image({
		image_url: imageData.url,
		galleryLink: imageData.galleryLink,
		postedBy:imageData.postedBy,
		title: imageData.title,
		description: imageData.description,
		created: timestamp
	});
	newImage.save();
	newImage.user.username = req.user.username;
	newImage.save();
	newImage.user.id = req.user._id;
	newImage.save();

	if(req.body.selection !== "base") {
		console.log("in conditional");
		boardName = req.body.selection;

		let newItem ={
			imageId: newImage._id,
			image_url: imageData.url,
			galleryLink: imageData.galleryLink,
			title: req.body.imgtitle,
			description: req.body.imgdesc,
			user: req.user.username,
			userId: req.user._id,
			postedBy: imageData.postedBy,
			created: timestamp
		}

		req.user.boards.filter((board, bi)  => {
			itemindex = board.board_items.length;
			console.log("in filter");
			if(board.board_name.toLowerCase() === boardName.toLowerCase()){
				newItem.boardindex = bi;
				board.board_items.push(newItem);
				req.user.save();
				newImage.boardindex = bi;
				newImage.save();
				res.redirect("/dashboard/" + req.params.id + "/" + "index="+bi);
			}else {
				console.log("failed to save user");
			}
		});
		
	}else {
		console.log("in else statement");

		boardName = req.body.boardname;
		let newBoard = {
			board_name: boardName,
			board_items: [{
				imageId: newImage._id,
				image_url: imageData.url,
				galleryLink: imageData.galleryLink,
				title: req.body.imgtitle,
				description: req.body.imgdesc,
				user: req.user.username,
				userId: req.user._id,
				postedBy: imageData.postedBy,
				boardOwner: req.user.username
			}],
			created: timestamp
		};

		let leng;
		if(req.user.boards.length < 1) {
			leng = 0;
		}else {
			leng = req.user.boards.length;
		}
		let bi = leng;
		newBoard.boardindex = bi;
		newBoard.board_items[0].boardindex = bi;
		req.user.boards.push(newBoard);
		req.user.save();
		newImage.boardindex = bi;
		newImage.save();

		res.redirect("/dashboard/" + req.params.id + "/" + "index="+bi);
	} //conditional
}); //router

router.get("/dashboard/:id/:query", isLoggedIn, (req, res, next) => {
	let q = querystring.parse(req.params.query);
	let save = q.save;
	let boardindex = parseInt(q.index);
	let boardList =[];
	let boardArr = [];

	User.findById(req.user._id).then((user) => {
		user.boards.forEach((board, bi) => {
			boardList.push(board);
			boardArr.push(bi);
		});

		res.render("dashboard", {
			save: save,
			board: q.board,
			boardIndex: boardArr,
			index: boardindex,
			user: req.user, 
			images: linkArr[boardindex],
			boardList:boardList
		});

	}).catch((err) => {console.log("err: ", err); throw err;});
});

router.get("/user-board/:id/:query", isLoggedIn, (req, res) => {
	let q = querystring.parse(req.params.query);
	console.log("q: ", q);
	boardIdx = parseInt(q.index, 10);

//In this case, req.params.id is the user._id of the user who created the board	
	User.findById(req.params.id).then((user) => {
		let selectedBoard = user.boards[boardIdx];
		console.log("selectedBoard: ", selectedBoard);
		console.log("userId: ", user._id);
		res.render("user-board", {
			//arrIdx: parseInt(q.arrIdx),
			index: boardIdx,
			boardOwnerId: user._id,
			user: user,
			userId: JSON.stringify(req.user._id),
			boardOwnerId: JSON.stringify(req.params.id),
			selectedBoard: selectedBoard
		});
	}).catch((err) => {console.log(err); throw err;});
});

router.get("/lightbox/:id/:query", (req, res) => {
	let q = querystring.parse(req.params.query);
	res.redirect("/user-board/" + req.params.id + "/" + "index=0" );
});

router.post("/user-image/:id/:query", isLoggedIn, isValidUrl, (req,res) => {
	let timestamp = new Date;
	console.log("test placeholder url: ", req.body.imageUrl)
	let q = querystring.parse(req.params.query);
	boardindex = parseInt(q.boardindex, 10);

	let newImage = {
		image_url: req.body.imageUrl,
		galleryLink: "",
		postedBy: req.user.username,
		boardindex: boardindex,
		title: req.body.imageTitle,
		description: req.body.description,
		created: timestamp
	};

	Image.create(newImage, (err, image) => {
		if(err) {
			console.log(err);
			throw err;
		}else {
			image.user.id = req.user._id;
			image.save();
			image.user.username = req.user.username;
			User.findById(req.user._id, (err, user) => {
			console.log("boardindex in image: ", boardindex);
				user.boards[boardindex].board_items.push(newImage);
				user.save();
				user.boards.filter((board) => {
					let boardItemsLength = board.board_items.length;
					board.board_items[boardItemsLength-1].user = user.username;
					board.board_items[boardItemsLength-1].userId = user._id;
					image.save();
				});

			});
				res.redirect("/user-board/" + req.user._id + "/" + "index="+ boardindex);
		}
	});
});

router.get("/user-pins/:id", isLoggedIn, (req, res) => {

	User.findById(req.params.id, (err, user) => {
		let pins = [];
		user.boards.forEach((board) => {
			board.board_items.forEach((item, i) =>{
				pins.push(item);
			});
		});
		console.log("pins in user-pins: ", pins);
		res.render("user-pins", {
				user: req.user,
				allPins: pins,
			});
	});
});

//Delete route for catalog image
router.post("/delete-img/:id/:imageId/:query", isLoggedIn, (req, res) => {
	Image.findByIdAndRemove(req.params.imageId, (err, img) => {
	console.log("in image delete");
		if(err) {
			console.log("error deleting image");
		}else {
			console.log("image deleted: ", img);
		}
		res.redirect("/catalog");
	});
});

//Delete route for individual user pin
router.post("/delete-pin/:id/:imageId/:query", isLoggedIn, (req, res) => {
	let q = querystring.parse(req.params.query);
	let bi = parseInt(q.boardindex);
	let ii = parseInt(q.itemindex);

	User.findById(req.params.id, (err, user) => {
		console.log("user board item: ", user.boards[bi].board_items);
		user.boards[bi].board_items.filter((item, i, ar) => {
			if(item.imageId === req.params.imageId) {
				ar.splice(i, 1);
			}
		});
		
		user.save();
	res.redirect("/catalog");
	});
});

//Delete route for user board
router.post("/delete-board/:id/:query", isLoggedIn, (req, res) => {
	let q = querystring.parse(req.params.query);
	let deletionIndex = q.i;
	let id = req.params.id;
	console.log("q from del-board: ", q);
	console.log("id from del-board: ", id);
	User.findById(id, (err, user) => {
		if(err) {
			console.log(err);
			throw err;
		}else {
			console.log("user.boards: ", user.boards);
			user.boards.splice(deletionIndex, 1);
			user.save();
			console.log("current user.boards: ", user.boards);
			res.redirect("back");
		}
	});
});

router.post("/add-board/:id", (req, res) => {
	let newBoard = req.body.newBoardName;
	console.log("newBoard: ", req.body.newBoardName);
	User.findById(req.params.id, (err, user) => {
		user.boards.push({board_name: req.body.newBoardName});
		user.boards[user.boards.length-1].boardindex = user.boards.length-1;
		user.save();
		res.redirect("/dashboard/" + req.params.id + "/" + "index=");
	});
});

router.get("/catalog", (req, res) => {
	console.log("in /catalog");
	Image.find({}, (err, allImg) => {
		/*console.log("all images: ", allImg);
		console.log("image id: ", typeof allImg[0].user.id);
		console.log("user id: ", typeof req.user._id);
		console.log(allImg[0].user.id.toString() === req.user._id.toString());*/
		if(err) {
			console.log(err);
			throw err;
		}else {
			res.render("catalog", {
				user: req.user,
				allImg: allImg,
			});
		}

	});
});

router.get("/pin/:id/:query", isLoggedIn, (req, res) => {
	let q = querystring.parse(req.params.query);
	let bi = q.boardindex;
	let ii = q.imageindex;

	console.log("q: ", q);
	
	Image.findById(q.imageId).then((img) => {
		let pinUrl = img.image_url;
		res.render("pin", {
			user: req.user,
			imageId: q.imageId,
			boardindex: JSON.parse(q.boardindex),
			image_url: pinUrl
		});
	}).catch((err) => {console.log(err);});
});

// To be completed: saving new boards, pushing image to either new board or existing board
router.post("/pin/:id/:query", isLoggedIn, (req, res) => {
	let boardName;
	let userBoards;
	let q = querystring.parse(req.params.query);
	console.log("q from post: ", q);
	let imgPin = [];

	if(req.body.selection === "base" && req.body.boardname === "") {
		return;
	}

	User.findById(req.params.id).then((user) => {

		Image.findById(q.imageId).then((img) => {
		imgPin.push(img);
		let boardindex;

			if(req.body.selection === "base" && req.body.boardname !== "") {
				boardName = req.body.boardname;
				user.boards.push({board_name: boardName});
				boardindex = user.boards.length-1;
				processPin(user, userBoards, imgPin, boardName, boardindex);
			}else {
				boardName = req.body.selection;
				console.log("user boards: ", user.boards);
				user.boards.filter((board, i) =>{
					if(board.board_name === req.body.selection) {
						if(i > 0) {
							boardindex = i;
						}else {
							boardindex = 0;
						}
					}
				});
				userBoards = user.boards;
				processPin(user, userBoards, imgPin, boardName, boardindex);
			}

				user.save().catch((err) => {console.log(err);});
				res.redirect("/catalog");

		}).catch((err) => {console.log("err: ", err);});
	}).catch((err) => {console.log("err: ", err);});
});

//controls header and pageload when "/" is called
router.get(["/", "/:term"], (req, res, next) => {

	console.log("session in index route: ", req.session.passport.user);

//using url and query from node's url module to get the value of imageSearch when images generated by search
	let urlUnit = url.parse(req.url, true);
	console.log(urlUnit.query.imageSearch);

//using query for express to get value of imageSearch
	let term = req.params.term || req.query.imageSearch;
	let options;

	if(!term || term === undefined) {
		options = {
	        url: "https://api.imgur.com/3/gallery/random/random/",
	        headers: {
	            "Authorization": process.env.IMGUR_CLIENT_ID
	        }
	    };
	}else {
		options = {
	        url: "https://api.imgur.com/3/gallery/search/?q=" + term,
	        headers: {
	            "Authorization": process.env.IMGUR_CLIENT_ID
	        }
	    };
	}

    let processImages = (err, response, body) => {
        let searchArr =[];
        linkArr.length = 0;

        if(err){
            console.log(err);
        }else{
            let info = JSON.parse(body);
            let result = info.data;
            let fac = 10;
            console.log("number of items in result: ", result.length);
            
            if(result.length < 1){
                result.length = 0;
                res.render("index");
                return;
            }else{
                for(var i = 0; i < fac; i++){
                    let images = result[i].images;
                    console.log("account_url: ", result[i].account_url);
                    if(images !== undefined) {
                    	searchArr.push(images);
                    }
                }

                searchArr.forEach((arr, i, ar) => {
                    	arr.forEach((ar) => {
                    		let imagePkg = {
                    			postedBy: result[i].account_url,
                    			url: ar.link,
                    			title: ar.title,
                    			description: ar.description,
                    			galleryLink: result[i].link
                    		}
                    		linkArr.push(imagePkg);
                    	});
                    });
            } //else

            Image.find({}, (err, allImg) => {
            	if(err) {
            		console.log(err);
            		throw err;
            	}else {
            		res.render("index", {
		            	user: req.user,
		            	images: linkArr,
		            	allImg: allImg
		            });
            	}
            });
        }
    }; //processImages()

 	request(options, processImages);
});


module.exports = router;