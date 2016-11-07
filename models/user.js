var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
  role: String,
  facebookId: String,
  treats: [String]
});

//plugin adds username, hash and salt for password
User.plugin(passportLocalMongoose);

//export the Model of the User schema
module.exports = mongoose.model('User', User);