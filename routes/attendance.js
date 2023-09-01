//requiring express for write Apis
const express = require("express");
//Referred to as a “mini-app”
const router = express.Router();
//The full list of supported APIs can be found on the Google APIs
const { google } = require("googleapis");
const OAuth2     = google.auth.OAuth2;
//Send emails from Node.js – easy way to send Email
const nodemailer = require("nodemailer");
//requiring passport for authentication user
const passport = require("passport");
//bcryptjs use to hash the passwords
const bcryptjs = require("bcryptjs");
//bcrypt use to compare the passwords
const bcrypt = require("bcrypt");
//Error handler package
const asyncHandler  = require("express-async-handler");
//requiring User model
const User = require("../models/user");
//requiring History model
const History = require("../models/loginHistory");
//requiring middleware
const middleware = require("../middleware/index");

//Render SignUp form
router.get("/signup", (req, res) => {
  res.render("signup");
});

//Handel SignUp Logic
router.post("/signup", (req, res) => {
  let name = req.body.fname + " " + req.body.lname;
  //current Date
  const date1 = new Date();
  var DateTime = date1.toISOString();

  //find if user already exist
  User.findOne({ username: req.body.username }).then((client) => {
    if (client) {
      //------------ User already exists ------------//
      req.flash("error", "This User Id is Already Taken, please try again!");
      // console.log("Email ID already registered");
      return res.redirect("/signup");
    } else { 
      //creating user
      let newUser = new User({
        name: name,
        dateOfjoining: req.body.dateofjoin,
        createdDate: DateTime,
        designation: req.body.designation,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
      });

      //salt password
      bcryptjs.genSalt(10, (err, salt) => {
        //hash password
        bcryptjs.hash(newUser.password, salt, (err, hash) => {
          if (err) {
            req.flash("error", err.message);
            return res.render("signup");
          } else {
            //update password
            newUser.password = hash;
            //save new user
            newUser.save().then((lawyer) => {
                req.flash("success", "Please Check Your Email");
                res.redirect("/");
              })
              .catch((err) => console.log(err));
          }
        });
      });


      //Sending Email (username & password) to Employee
      const Clienttransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: "OAuth2",
            user: "nodejsa@gmail.com",
            clientId: "173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com",
            clientSecret: "OKXIYR14wBB_zumf30EC__iJ",
            refreshToken: "1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w"
        },
    });

    const EmployeeMailOption = {
        from: '"EezahTech Family" <nodejsa@gmail.com>', // sender address
        to: newUser.email, // list of receivers
        subject: "EezahTech (Attendance Info)", // Subject line
        html: `
        <p>Hi ${newUser.name}</p>
        <p>Welcome to EezahTech Attendance System. Here are your credential:</p>
        <p><b>User ID:</b> ${newUser.username}</p> 
        <p>please use this to mark your daily attendance</p>
        `,
    };

    Clienttransporter.sendMail(EmployeeMailOption, (error, info) => {
        if (error) {
            console.log(error);
           console.log("Something went wrong on our end. Please try again later.");
        }
        else 
        {
            console.log('Mail sent : %s', info.response);
        }
    }); 
  }
  });
});

//Render Login form
router.get("/", (req, res) => { 
  res.render("login");
});

//Handel CheckIn Button Logic
router.post("/loginBtn", (req, res, next) => {
  //   console.log(req.body);
  User.findOne({ username: req.body.username }, function (err, user) {
    if (err) {
      //   req.flash("error", err.message);
      const err1 = { message: err.message };
      res.send(err1);
    }
    if (!user) { 
      //if user is not registered
      const err1 = { message: "This User ID is Not Registered" };
      res.send(err1);
      // res.redirect("/");
    } else {
      //------------ Password Matching ------------//
      bcrypt.compare(req.body.username, user.password, (err, isMatch) => {
        if (err) {
          console.log(err);
        }
        if (isMatch) {
          //if User Matched
          //current Time
          let dt = new Date();
          let hours = dt.getHours();
          let mints = dt.getMinutes();
          let seconds = dt.getSeconds();
          if (hours < 10) {
            hours = "0" + hours;
          }
          if (mints < 10) {
            mints = "0" + mints;
          }
          if (seconds < 10) {
            seconds = "0" + seconds;
          }
          var time = "" + hours + ":" + mints + ":" + seconds;

          //Current Date
          const date1 = new Date();
          var tempDate = Date.UTC(
            date1.getFullYear(),
            date1.getMonth(),
            date1.getDate()
          );
          var currentDate = new Date(tempDate);
          // console.log(currentDate);

          //find if history is already exist against current employee in current date
          History.findOne({username: user.username, $or: [{ loginDate: currentDate }, { logoutDate: currentDate }]}, (err, element) => {
              if (err) {
                console.log(err);
              }
              if (element == null) {
                //if history is not exist against current employee
                let newHistory = new History({
                  username: req.body.username,
                  email: user.email,
                  loginTime: time,
                  loginDate: currentDate,
                  logoutTime: 0,
                  totalTime: 0
                });
                //save history
                newHistory.save();
                //login/checkIn the employee 
                req.login(user, function (err) {
                  if (err) {
                    return next(err);
                  }
                  res.send("/checkIn");
                });
              } else {
                //if history already exist against current user
                //And login time is not zero its mean employee already have done login at current date
                if (element.loginTime != 0) {
                  // console.log("You have already done Login in Today's Date");
                  // req.flash("error","You have already done Login in Today's Date");
                  const err1 = {
                    message: "You have already done Login in Today's Date",
                  };
                  res.send(err1);
                } else {
                  // Updating Employee
                  History.updateOne(
                    { _id: element.id },
                    { $set: { loginTime: time, loginDate: currentDate } },
                    (err, user) => {
                      if (err) {
                        console.log(err);
                      }
                    }
                  );
                  //login Employee
                  req.login(user, function (err) {
                    if (err) {
                      return next(err);
                    }
                    res.send("/checkIn");
                  });
                }
              }
            }
          );
        } else {
          //   console.log("Password incorrect! Please try again.");
          const err1 = { message: "User ID incorrect! Please try again" };
          res.send(err1);
        }
      });
    }
  });
});

//Handel Check out Button Logic
router.post("/logoutBtn", (req, res, next) => {
  User.findOne({ username: req.body.username }, function (err, user) {
    if (err) {
      //   req.flash("error", err.message);
      //   res.redirect("/");
      const err1 = { message: err.message };
      res.send(err1);
    }
    //if user is not registered
    if (!user) { 
      // console.log("This Email is Not Registered");
      // req.flash("error", "This Email is Not Registered");
      const err1 = { message: "This ID is Not Registered" };
      res.send(err1);
    } else {
      //------------ Password Matching ------------//
      bcrypt.compare(req.body.username, user.password, (err, isMatch) => {
        if (err) {
          console.log(err);
        }
        if (isMatch) {
          //if User Matched
          //current Time
          let dt = new Date();
          let hours = dt.getHours();
          let mints = dt.getMinutes();
          let seconds = dt.getSeconds();
          if (hours < 10) {
            hours = "0" + hours;
          }
          if (mints < 10) {
            mints = "0" + mints;
          }
          if (seconds < 10) {
            seconds = "0" + seconds;
          }
          var time2 = "" + hours + ":" + mints + ":" + seconds;

          //Current Date
          const date1 = new Date();
          var tempDate = Date.UTC(
            date1.getFullYear(),
            date1.getMonth(),
            date1.getDate()
          );
          var currentDate2 = new Date(tempDate);

          //find if history is already exist against current employee in current date
          History.findOne({username: user.username, $or: [{ loginDate: currentDate2 }, { logoutDate: currentDate2 }]}, (err, find) => {
              if (err) {
                console.log(err);
              }
              // console.log(find);
              if (find == null) {
                //if history is not exist against current employee in current date
                //Create new History 
                let newHistory = new History({
                  username: req.body.username,
                  email: user.email,
                  logoutTime: time2,
                  logoutDate: currentDate2,
                  loginTime: 0,
                  totalTime: 0
                });
                //save history
                newHistory.save();
                //login/checkout employee
                req.login(user, function (err) {
                  if (err) {
                    return next(err);
                  }
                  res.send("/checkOut");
                });
              } else {
                var totaltime = 0;
                if (find.loginTime != 0) {
                  // Total Time
                  let loginHours = find.loginTime.slice(0, 2);
                  let loginMints = find.loginTime.slice(3, 5);
                  let loginSec = find.loginTime.slice(6, 8);
                  let a = Number(loginMints) / 60;
                  let b = Number(loginSec) / 3600;
                  let loginTimeInPoints = Number(loginHours) + a + b;

                  let currentHours = time2.slice(0, 2);
                  let currentMints = time2.slice(3, 5);
                  let currentSec = time2.slice(6, 8);
                  let c = Number(currentMints) / 60;
                  let d = Number(currentSec) / 3600;
                  let currentTimeInPoints = Number(currentHours) + c + d;

                  let t = currentTimeInPoints - loginTimeInPoints;
                  let decimalTimeString = t.toString();

                  var decimalTime = parseFloat(decimalTimeString);
                  decimalTime = decimalTime * 60 * 60;
                  var hors = Math.floor(decimalTime / (60 * 60));
                  decimalTime = decimalTime - hors * 60 * 60;
                  var minutes = Math.floor(decimalTime / 60);
                  decimalTime = decimalTime - minutes * 60;
                  var seconds = Math.floor(decimalTime);

                  if (hors < 10) {
                    hors = "0" + hors;
                  }
                  if (minutes < 10) {
                    minutes = "0" + minutes;
                  }
                  if (seconds < 10) {
                    seconds = "0" + seconds;
                  }
                  totaltime = "" + hors + ":" + minutes + ":" + seconds;
                }

                //if history already exist against current employee in current date
                //Update employee's logoutTime, looutDate, and Calculated totalTime
                History.updateOne({ _id: find.id },{$set: {logoutTime: time2,logoutDate: currentDate2,totalTime: totaltime}},(err, user) => {
                    if (err) {
                      console.log(err);
                    }
                  });
                //login/Checkout employee
                req.login(user, function (err) {
                  if (err) {
                    return next(err);
                  }
                  res.send("/checkOut");
                });
              }
            }
          );
        } else {
          //   console.log("Password incorrect! Please try again.");
          const err1 = { message: "User ID incorrect! Please try again" };
          res.send(err1);
        }
      });
    }
  });
});

//APi to render CheckIn Page
router.get("/checkIn", middleware.isUserLoggedIn, (req, res) => {
  const date1 = new Date();
  var tempDate = Date.UTC(
    date1.getFullYear(),
    date1.getMonth(),
    date1.getDate()
  );
  var currentDate3 = new Date(tempDate);

    //finding employee
  History.findOne({ username: req.user.username, loginDate: currentDate3 }, (err, find) => {
      if (err) {
        console.log(err);
      }

      if(!find)
      {
        res.redirect("/");
      }
      else
      {
        let setLoginDate = new Date(find.loginDate).toUTCString();
        let loginD = setLoginDate.slice(0, 17);
      
        res.render("checkIn", { user: find, loginDate: loginD });
      }
    }
  );
});

//APi to render CheckOut Page
router.get("/checkOut", middleware.isUserLoggedIn, async (req, res) => {
  const date1 = new Date();
  var tempDate = Date.UTC(
    date1.getFullYear(),
    date1.getMonth(),
    date1.getDate()
  );
  var currentDate4 = new Date(tempDate);

  //finding employee
  History.findOne({ username: req.user.username, logoutDate: currentDate4 }, (err, find) => {
      if (err) {
        console.log(err);
        res.redirect("/");
      } 

      if(!find)
      {
        res.redirect("/");
      }
      else
      {
        let setLoginDate = new Date(find.loginDate).toUTCString();
        let loginD = setLoginDate.slice(0, 17);
        let setLogoutDate = new Date(find.logoutDate).toUTCString();
        let logoutD = setLogoutDate.slice(0, 17);
        //if employee did not logIn
        if(loginD == "Invalid Date")
        {
          res.render("checkOut", {
            user: find,
            loginDate: "NA",
            logoutDate: logoutD,
          });
        }
        else
        {
          res.render("checkOut", {
            user: find,
            loginDate: loginD,
            logoutDate: logoutD,
          });
        } 
      }
      
    }
  );
});

//Api for Current LoggedIn Employee's History
router.get("/loginEmployeHistory", middleware.isUserLoggedIn, asyncHandler(async (req, res) => {
    const data = await History.find({ username: req.user.username });
    res.send(data); 
}));
 
 
// //Show Change Password Page for employee
// router.get("/checkOut/change-password", middleware.isUserLoggedIn, async (req, res) => {
//   res.render("employeeChangePassword");
// });

// //Change Password - Update Employee Password
// router.put("/checkOut/change-password", middleware.isUserLoggedIn, asyncHandler(async (req, res) => {
//   var { oldPassword, newPassword, confirmPassword } = req.body.ChangePass;
  
//   //------------ Checking password mismatch ------------//
//   if (newPassword != confirmPassword) {
//       console.log("New and Confirm Passwords do not match");
//       req.flash("error", "New and Confirm Passwords do not match!");
//       return res.redirect("/checkOut/change-password");
//   }

//   //------------ Checking password length ------------//
//   if (newPassword.length < 5) {
//       req.flash("error", "Password must be at least 5 characters!");
//       console.log("Password must be at least 8 characters");
//       return res.redirect("/checkOut/change-password");
//   }
//   else 
//   { 
//       // get user
//       const user = await User.findOne({ username: req.user.username });
//       if (!user) {
//           req.flash("error", "User not found!");
//           console.log('User not found');
//           return res.render("employeeChangePassword");
//       }
//       else
//       {
//         // validate old password
//         const isValidPassword = await bcrypt.compare(oldPassword, user.password);
//         if (!isValidPassword) {
//             req.flash("error", "Old password is Incorrect!");
//             console.log('Please enter correct old password');
//             return res.redirect("/checkOut/change-password");
//         }
//         else 
//         {
//             const salt = await bcryptjs.genSalt(10);  
//             const hash = await bcryptjs.hash(newPassword, salt);   
//             user.password = hash;
//             await user.save();  
//             console.log("Password Updated Successfully");
//             req.flash("success", "Password Updated Successfully!");
//             res.redirect("/checkOut/change-password"); 
//         } 
//       }
//   }
// }));


//Logout Route
router.get("/logout", (req, res) => {
    req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

//exporting attendance routes
module.exports = router;
