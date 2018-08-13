require("../../.config/config");
const express = require("express");
const passport = require("passport");
const router = express.Router();
const mongoose = require("mongoose");
const request = require("request");
const User = require("../models/users"); //Destructuring not used due to use of plugin in User model
//const {image} = require("../models/images");
const query = require("querystring");
let passportTwitter = require("../../auth/twitter");

let linkArr = [];

router.get('/favicon.ico', (req, res) => res.status(204));

router.get("/data", (req, res, next) => {
	console.log("user from /data: ", req.user);
	res.json(linkArr);
});

let isAuthenticated = (req, res, next) => {
	console.log("req.params.id: ", typeof req.params.id);
	console.log("req.user._id: ", typeof req.user._id.toString());
	if(req.params.id === req.user._id.toString()) {
		console.log("Authenticated!");
		next();
	}else if(!req.params.id ||  req.params.id === undefined){
		console.log("Not authenticated");
		res.redirect("/login");
	}
}

router.get("/selection", (req, res) => {
	//console.log("query: ", req.params.query);
	res.redirect("/dashboard" + req.params.id);
});

/*router.post("/img-selection/:id", isAuthenticated, (req, res) => {
	console.log("form data: ", req.body);
	console.log("linkArr: ", linkArr.length);
	let newBoard = {
		board_name: req.body.boardname,
		board_items: [{
			image_url: "",
			title: req.body.imgtitle,
			description: req.body.imgdesc,
			postedBy: "",
			boardOwner: req.user.username
		}]
	};

	console.log("newBoard: ", newBoard);

	req.user.board.push(newBoard);
	req.user.save();
	console.log("req.user: ", req.user);
	res.redirect("/dashboard/" + req.params.id);
});*/

router.get("/dashboard/:id",isAuthenticated, (req, res, next) => {
	res.render("dashboard", {
		user: req.user, 
		images: linkArr
	});
});

router.get("/profile/:id", (req, res, next) => {
	let id = req.params.id;
	User.findById(id, (err, user) => {
		console.log("user: ", req.user.username);
	});
	res.render("profile", {user: req.user.username});
});

router.get("/my-images", (req, res) => {

})

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

router.post("/user-register", (req, res, next) => {
	console.log("req.body:", req.body);

	let newUser = new User({
		username: req.body.username,
		email: req.body.email
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

router.post("/login", passport.authenticate("local"), (req, res, next) => {
	console.log("req.user: ", req.user);
	console.log("Login successful");
	res.redirect("/");
});

/* --  Note to self: variations on inclusion of passport.authenticate("local");

router.post('/login', function(req, res, next) {
	console.log("req.user: ", req.user);
  passport.authenticate('local', function(err, user, info) {
  	console.log("user: ", user);
  	console.log("info: ", info);
    if (err) return next(err);
    if (!user) {
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      return res.redirect('/profile/' + req.user._id);
    });
  })(req, res, next);
});

/*router.post("/login", (req, res) => passport.authenticate("local", {
	successRedirect: "/",
	failureRedirect: "login"
})(req, res));

*/

router.get("/auth/twitter", passportTwitter.authenticate("twitter"));

router.get("/auth/twitter/callback", passportTwitter.authenticate("twitter", {failureRedirect: "/login"}), function(req, res) {
	res.redirect("/");
});

/*router.get("/index", (req, res) => {
	res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	res.redirect("/");
});*/

router.get(["/", "/:term"], (req, res, next) => {
	//console.log("currentUser: ", currentUser);
	console.log("req.user: ", req.user);

	console.log("index route accessed");

	let term = req.params.term;
	let options;

	console.log("term: ", term);

	if(!term || term === undefined) {
		options = {
        //url: "https://api.imgur.com/3/gallery/search/?q=" + searchTerm,
	        url: "https://api.imgur.com/3/gallery/random/random/",
	       // url: "",
	        headers: {
	            "Authorization": process.env.IMGUR_CLIENT_ID
	        }
	    };
	}else {
		options = {
	        url: "https://api.imgur.com/3/gallery/search/?q=" + term,
	        //url: "https://api.imgur.com/3/gallery/random/random/",
	        headers: {
	            "Authorization": process.env.IMGUR_CLIENT_ID
	        }
	    };
	}
    
    let processImages = (err, response, body) => {
        let searchArr =[];
        /*let linkArr = [];*/
        linkArr.length = 0;
       // res.locals.storage.length = 0;
        
        if(err){
            console.log(err);
        }else{
            let info = JSON.parse(body);
            let result = info.data;
            //console.log("RESULT: ", result);
            //let fac = result.length < 10 ? result.length : 25;
            let fac = 3;
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
                    		//console.log("AR: ", ar);
                    		let imagePkg = {
                    			postedBy: result[i].account_url,
                    			link: ar.link,
                    			title: ar.title,
                    			description: ar.description,
                    			galleryLink: result[i].link
                    		}
                    		//res.locals.storage.push(imagePkg);
                    		linkArr.push(imagePkg);
                    		console.log("linkArr: ", linkArr[0]);
                    	});
                    });
            }
            res.render("index", {
            	user: req.user,
            	images: linkArr
            });
        }
    };
    
    request(options, processImages);
});


module.exports = router;