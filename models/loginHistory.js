//requiring mongoose for creating schema
const mongoose = require("mongoose");

//Creating new Schema History
let HistorySchema = new mongoose.Schema({
    username: String,
    email: String,
    loginTime: String,
    loginDate: Date,
    logoutTime: String,
    logoutDate: Date,
    totalTime: String
});

//exporting History Schema
module.exports = mongoose.model("History", HistorySchema, "History");