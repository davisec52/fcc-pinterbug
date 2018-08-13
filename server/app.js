require("../.config/config");
const express = require("express");
const app = express();
const expressSession = require("express-session");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const path = require("path");
const publicPath = path.join(__dirname, "../public");
const indexRoutes = require("./routes/index-routes");
const User = require("./models/users");

let port = process.env.PORT || 3000;

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, {
	promiseLibrary: mongoose.promise
}).then((db) => {console.log("mongodb connected")}).catch((err) => {
	console.log("error connecting to db");
	throw err;
});

app.set("views", publicPath + "/views");
app.use(express.static(publicPath));
app.set("view engine", "ejs");
//app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(expressSession({
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.temp = [];
	next();
});

app.use("/", indexRoutes);


app.listen(3000, () => {
	console.log(`Pinter server listening on ${port}`);
})