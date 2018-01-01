// app/models/user.js

var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var genId = require('./gen-id');

function prefix(pid) {
  return 'u' + pid;
}

// define the schema for our user model
var userSchema = mongoose.Schema({
    pid: {
        type: String,
        unique: true
    },
    creationTime: {type: Date, default: Date.now},
    name :{
        first: String,
        last: String,
    },
    isHelper : Boolean,
    firstLogin : Boolean,
    home : {
        lat: Number,
        lng: Number
    },
    transportModes : {
        bike: Boolean,
        car: Boolean,
        public: Boolean
    },

    local            : {
        email        : String,
        password     : String,
        resetPasswordToken: String,
        resetPasswordExpires: Date
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }

});

userSchema.pre('save', function(next) {
  let schema = this
  genId.public('u', schema, next)
})

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
