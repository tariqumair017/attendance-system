//requiring Admin model
const Admin = require("../models/admin");
//requiring User model
const User = require("../models/user");



//All middleware are here
var middlewareObj ={};

//Creating middleware function to find if Admin is loggedIn 
middlewareObj.isAdminLoggedIn = function(req, res, next)
{   
    //is admin Logged in?
    if(req.isAuthenticated())
    {   
        //find if admin exist
        Admin.findById(req.user._id, (err, admin) => {
            if(err)
            {
                console.log(err);
            }
            else
            { 
                //if admin found
                if(admin)
                {
                    return next();
                }
                else
                {
                    //if admin not found
                    req.flash("error", "You Don't have Permission!");
                    res.redirect("back");
                }
            }
        });
    }
    else
    { 
        req.flash("error", "Please Login First!!");
        res.redirect("/");
    }
}


//Creating middleware function to find if User is loggedIn 
middlewareObj.isUserLoggedIn = function(req, res, next)
{
    //is user Logged in?
    if(req.isAuthenticated())
        {   
            //find if user exist
            User.findById(req.user._id, (err, client) => {
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    //if user found
                    if(client)
                    {
                        return next();
                    }
                    else
                    {
                         //if user not found
                        req.flash("error", "You Don't have Permission!");
                        res.redirect("/");
                    }
                }
            });
        }
    else
        {
            req.flash("error", "Please Use Credentials!");
            res.redirect("/");
        }
}



//exporting middlewareObject
module.exports = middlewareObj;