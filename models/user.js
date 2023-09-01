//requiring mongoose for creating schema
const mongoose = require("mongoose");
//passport-local-mongoose is a Mongoose plugin that simplifies building username and password login with Passport
const passportLocalMongoose = require("passport-local-mongoose");

//Creating new Schema User
let UserSchema = new mongoose.Schema({
    name: String,
    dateOfjoining: Date,
    createdDate: Date,
    updatedDate: Date,
    designation: String,
    email: String,
    username: {
        type:String,
        unique:true
    },
    password: String
});

//plugin User schema
UserSchema.plugin(passportLocalMongoose);
//exporting schema
module.exports = mongoose.model("User", UserSchema);