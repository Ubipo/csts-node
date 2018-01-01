// app/models/pid-generator.js

const cryptoStr = require('crypto-random-string');


module.exports = {
	public: function(prefix, schema, next) {
		var c = 0;
	    var pid = prefix + cryptoStr(5).toUpperCase(); // generate pid like uD487E or t4SD86
	    schema.constructor.findOne({'pid': pid}, function(err, obj) {
	    	if (err)
	    		next(err);

	        // if an obj already has that id just choose another
	        if (!obj) {
	        	schema.pid = pid;
    			next();
	        } else {
	        	c++
		        if (c>10) {
		        	next(err);
		        } else {
		        	this(prefix, schema, next);
		        }
	        }
	    });
	}
}

