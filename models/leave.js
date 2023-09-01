//requiring mongoose for creating schema
const mongoose = require("mongoose");

//Creating new Leave Schema
let LeaveSchema = new mongoose.Schema({
    username: String,
    HalfDayorFullDay: String,
    leaveDate: Date,
    leaveTime: String,
    firstSecondHalf: String,
    startDate: Date,
    endDate: Date,
    leaveType: String,
    reason: String
});

//exporting Leave Schema
module.exports = mongoose.model("Leave", LeaveSchema);