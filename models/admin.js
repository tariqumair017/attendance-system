//requiring mongoose for creating schema
const mongoose = require("mongoose");
//passport-local-mongoose is a Mongoose plugin that simplifies building username and password login with Passport
const passportLocalMongoose = require("passport-local-mongoose");
 
//Creating new Admin Schema
let AdminSchema = new mongoose.Schema({
    username: {
        type:String,
        unique:true
    },
    password: String
});

//plugin Admin schema
AdminSchema.plugin(passportLocalMongoose);
//exporting schema
module.exports = mongoose.model("Admin", AdminSchema);