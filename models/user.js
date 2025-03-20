const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    number: { type: String },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);