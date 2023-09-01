//requiring express for write Apis
const express = require("express");
//Referred to as a “mini-app”
const router = express.Router();
//requiring passport for authentication user
const passport = require("passport");
//bcryptjs use to hash the passwords
const bcryptjs = require("bcryptjs");
//bcrypt use to compare the passwords
const bcrypt   = require("bcrypt");
//Error handler package
const asyncHandler  = require("express-async-handler");
//requiring Admin model
const Admin = require("../models/admin");
//requiring History model 
const History = require("../models/loginHistory");
//requiring Leave model 
const Leave = require("../models/leave");
//requiring middleware
const middleware = require("../middleware/index");

//Rendering/Show SignUp form
router.get("/adminSignup", (req, res) => {
  res.render("adminSignup");
});

//Handel SignUp Logic
router.post("/adminSignup", (req, res) => {
  //finding if user already exist
  Admin.findOne({ username: req.body.username }).then((client) => {
    if (client) {
      //------------ User already exists ------------//
      req.flash("error", "Email ID already registered");
      // console.log("Email ID already registered");
      return res.redirect("/adminSignup");
    } else {
      if(req.body.password.length < 5)
      {
        req.flash("error", "Password must be at least 5 characters!");
        // console.log("Password must be at least 5 characters!");
        return res.redirect("/adminSignup");
      }
      else
        { 
          //Creating New Admin
          const newAdmin = new Admin({
            username: req.body.username,
            password: req.body.password,
          });
          //salt password
          bcryptjs.genSalt(10, (err, salt) => {
          //hash password
            bcryptjs.hash(newAdmin.password, salt, (err, hash) => {
              if (err) {
                console.log(err);
                req.flash("error", err.message);
                return res.render("adminSignup");
              }
              //Update hash password
              newAdmin.password = hash;
              //Save Admin  
              newAdmin
                .save()
                .then((lawywer) => {
                  res.redirect("/admin-eezahtech");
                })
                .catch((err) => console.log(err));
            });
          });
        }
    }
  });
});

//Show/Rendering Login form
router.get("/admin-eezahtech", (req, res) => {
  res.render("adminLogin");
});

//Handel Login Button Logic and Authenticate Admin
router.post("/admin-login", (req, res, next) => {
  passport.authenticate("Admin", {
    successRedirect: "/history",
    failureRedirect: "/admin-eezahtech",
    failureFlash: true,
  })(req, res, next);
});

//Rendering Employee History page
router.get("/history", middleware.isAdminLoggedIn, async (req, res) => {
  res.render("usersHistory");
});

//Api Filter Employee
router.get("/allHistory", middleware.isAdminLoggedIn, asyncHandler(async (req, res) => {
  var selectedUser = req.query.selectedUser;
  var fromDate = req.query.fromDate;
  var toDate = req.query.toDate;

  //filters
  if (selectedUser == "All" && fromDate == "" && toDate == "") {
    // console.log("All Should Showing");
    const data = await History.find({});
    res.send(data);
  } else if (selectedUser != "All" && fromDate == "" && toDate == "") {
    // console.log("Only for Username");
    const data2 = await History.find({ email: selectedUser });
    res.send(data2);
  } else if (fromDate != "" && toDate != "" && selectedUser == "All") {
    // console.log("From-date To to-date");
    const data3 = await History.find({
      $and: [
        { loginDate: { $gte: fromDate } },
        { loginDate: { $lte: toDate } },
      ],
    });
    res.send(data3);
  } else if (selectedUser != "All" && fromDate != "" && toDate != "") {
    // console.log("When all Selected");
    const data4 = await History.find({
      $and: [
        { email: { $eq: selectedUser } },
        {
          $and: [
            { loginDate: { $gte: fromDate } },
            { loginDate: { $lte: toDate } },
          ],
        },
      ],
    });
    res.send(data4);
  }
}));


//Rendering Leave Page
router.get("/history/leave", middleware.isAdminLoggedIn, async (req, res) => {
  res.render("addLeave");
});

//Save New Leave Page (Ajax Post)
router.post("/history/leave", middleware.isAdminLoggedIn, asyncHandler(async (req, res) => {

  if(req.body.StartDate)
  {
      const newLeave = new Leave({
        username: req.body.username,
        HalfDayorFullDay: req.body.HalfFullDay,
        startDate: req.body.StartDate,
        endDate: req.body.EndDate,
        leaveType: req.body.leaveType,
        reason: req.body.reason
      });

      await newLeave.save();
      res.send("/history");
  }
  else if(req.body.leaveDate)
  {
    // var Ldate = new Date(req.body.leaveDate);

      const newLeave = new Leave({
        username: req.body.username,
        HalfDayorFullDay: req.body.HalfFullDay,
        leaveDate: req.body.leaveDate,
        leaveTime: req.body.leaveTime,
        firstSecondHalf: req.body.FirstSecondHalf,
        leaveType: req.body.leaveType,
        reason: req.body.reason
      });

      await newLeave.save();
      res.send("/history");
  }
}));

//Api for Unique Employee for Add-New-Leave-Page
router.get("/uniqueEmployeeForLeave", middleware.isAdminLoggedIn, asyncHandler(async (req, res) => {
  //finding distinct query
  const data = await History.distinct("email"); 
  res.send(data);
}));

 
//Render View Leave Page
router.get("/history/viewLeaves", middleware.isAdminLoggedIn, async (req, res) => {
  res.render("viewLeaves");
});

//Api to Get All Leaves
router.get("/history/allLeaves", middleware.isAdminLoggedIn, asyncHandler(async (req, res) => {
  var selectedUser = req.query.selectedUser;

   if (selectedUser == "All") {
    // console.log("All");
    const data = await Leave.find({});
    res.send(data);
  } else if (selectedUser != "All") {
    // console.log("Only for Username");
    const data2 = await Leave.find({ username: selectedUser });
    res.send(data2);
  }
}));


//At View Leaves page, Unique Employee to Search
router.get("/history/allUniqueEmployees", middleware.isAdminLoggedIn, asyncHandler(async (req, res) => {
  //finding distinct username query  
  const data = await Leave.distinct("username");
    res.send(data);   
}));
 
//Show Change Password Page
router.get("/history/change-password", middleware.isAdminLoggedIn, async (req, res) => {
  res.render("adminChangePassword");
});

//Change Password - Update Admin Password
router.put("/history/change-password", middleware.isAdminLoggedIn, asyncHandler(async (req, res) => {
  var { oldPassword, newPassword, confirmPassword } = req.body.ChangePass;
  
  //------------ Checking password mismatch ------------//
  if (newPassword != confirmPassword) {
      console.log("New and Confirm Passwords do not match");
      req.flash("error", "New and Confirm Passwords do not match!");
      return res.redirect("/history/change-password");
  }

  //------------ Checking password length ------------//
  if (newPassword.length < 5) {
      req.flash("error", "Password must be at least 5 characters!");
      console.log("Password must be at least 8 characters");
      return res.redirect("/history/change-password");
  }
  else 
  { 
      // get admin
      const user = await Admin.findOne({ username: req.user.username });
      if (!user) {
          req.flash("error", "User not found!");
          console.log('User not found');
          return res.render("adminChangePassword");
      }
      else
      {
        // validate old password
        const isValidPassword = await bcrypt.compare(oldPassword, user.password);
        if (!isValidPassword) {
            req.flash("error", "Old password is Incorrect!");
            console.log('Please enter correct old password');
            return res.redirect("/history/change-password");
        }
        else 
        {
            //salt password
            const salt = await bcryptjs.genSalt(10);  
            //hash password
            const hash = await bcryptjs.hash(newPassword, salt);   
            //update password
            user.password = hash;
            //save password
            await user.save();  
            console.log("Password Updated Successfully");
            //Flash success message
            req.flash("success", "Password Updated Successfully!");
            //redirect
            res.redirect("/history/change-password"); 
        } 
      }
  }
}));


//exporting admib router
module.exports = router;
