// app/models/ticket.js

var mongoose = require('mongoose');
var genId = require('./gen-id');

// define ticket schema
var ticketSchema = mongoose.Schema({
    pid: {
	    type: String,
	    unique: true
    },
    creationTime: {type: Date, default: Date.now},
    resolved: Boolean,
    description: String,
    audioId: String,
    tags: [String],
    requester: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    helpers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});


ticketSchema.pre('save', function(next) {
  let schema = this
  genId.public('t', schema, next)
})

// methods ======================
// userSchema.methods.generateHash = function(password) {
//     return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
// };

module.exports = mongoose.model('Ticket', ticketSchema);

