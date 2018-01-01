var geocoder = require('google-geocoder');

module.exports = {
	coordinates: function(address, callback) {
		var geo = geocoder({
		  key: process.env.GOOLE_API_KEY,
		});

		geo.find(address, function(err, res){
			if (err){
				console.log(err);
				throw err;
			}
			callback(res[0]);
		});
	}
}