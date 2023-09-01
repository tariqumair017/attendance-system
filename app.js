//requiring express for write Apis
const express       = require("express");
const app           = express();
//requiring connect-flash to show messages
const flash         = require("connect-flash");
//bcrypt use to compare the passwords
const bcrypt        = require("bcrypt");
//bcryptjs use to hash the passwords
const bcryptjs      = require("bcryptjs");
//requiring express body-parser to parse body
const bodyParser    = require("body-parser");
//requiring mongoose for connection with MongoDB
const mongoose      = require("mongoose");
//requiring passport for authentication user
const passport      = require("passport");
//local stratigy to authenticate user
const localStrategy = require("passport-local");
//method-override allow to use http verbs at client side
const methodOverride= require("method-override");
//requiring express-session package to manage session for user
const session       = require("express-session");
//requiring User model
const User          = require("./models/user");
//requiring Admin model
const Admin         = require("./models/admin");
//requiring History model 
const History       = require("./models/loginHistory");
//tell the App to listen at port 8000 (user defined)
const port          = process.env.PORT || 8000;


//Requring Attendance Routes
const attendanceRoutes  = require("./routes/attendance");
//Requring Admin Routes
const adminRoutes  = require("./routes/admin");

//Restricted options for mongoose DB 
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    autoIndex: false, // Don't build indexes
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
}

//mongoDB Connection with mongoose
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/eezahtech1", options);
//Tell app view engine will be ejs 
app.set("view engine", "ejs");
//parses incoming requests with urlencoded payloads and is based on body-parser
app.use(bodyParser.urlencoded({extended: true}));
//specifies and static the root directory for assets. 
app.use(express.static(__dirname + "/public"));
//Use method-override
app.use(methodOverride("_method"));
//Use flash
app.use(flash());

//Use Session 
app.use(session({
    secret: "EezahTech is myfirst company",
    resave: false,
    saveUninitialized: false
}));
// app.use(passport.initialize());
// app.use(passport.session());
// //User
// passport.use('User', new localStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// //Admin
// passport.use('Admin', new localStrategy(Admin.authenticate()));
// passport.serializeUser(Admin.serializeUser());
// passport.deserializeUser(Admin.deserializeUser());

// PASSPORT CONFIGURATION
//Authentication For User
passport.use('User',new localStrategy((username, password, done) => {
    //------------ User Matching ------------//
    //console.log(username)
    User.findOne({username:username}).then(user => {
        //console.log(user)
        if (!user) {
            console.log("This Username or email ID is not registered");
            return done(null, false, { message: 'This User is not registered!!' });
        }

        //------------ Password Matching ------------//
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {console.log(err)};
            if (isMatch) {
                return done(null, user);
            } else {
                console.log("Password incorrect! Please try again.");
                return done(null, false, { message: 'Password incorrect! Please try again!!' });
            }
        });
});
}));
passport.serializeUser((User,done)=>{
done(null,User);
});
passport.deserializeUser(function(User, done) {
if(User!=null)
done(null,User);
});

//Authentication For Admin
passport.use('Admin',new localStrategy((username, password, done) => {
    //------------ User Matching ------------//
    Admin.findOne({username:username}).then(user => {
        if (!user) {
            // console.log("This Username or email ID is not registered");
            return done(null, false, { message: 'This Email ID is not registered' });
        }

        //------------ Password Matching ------------//
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {console.log(err)};
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect! Please try again.' });
                //console.log("Password incorrect! Please try again.");
            }
        });
});
}));
passport.serializeUser((Admin,done)=>{
done(null,Admin);
});
passport.deserializeUser(function(Admin, done) {
if(Admin!=null)
done(null,Admin);
});

app.use(passport.initialize());
app.use(passport.session());

//Middleware for accessing locals at every page
app.use(function(req, res, next){
    // caching disabled for every route 
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    // Storing current user in currentUser variable
    res.locals.currentUser = req.user; 
    // Using error variable for flash message
    res.locals.error = req.flash("error");
    // Using Success variable for flash message
    res.locals.success = req.flash("success");
    next();
});

//Using Routes
app.use(attendanceRoutes);
app.use(adminRoutes);


 //if URL is not exist then 404 page will render
app.use((req, res, next) => {
    res.status(404).render("404");
});



// Tell Express to Listen request
app.listen(port, () => {
    console.log(`Server has started at http://localhost:${port}`);
  });