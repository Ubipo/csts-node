var geocoder = require('google-geocoder');

module.exports = {
	coordinates: function(address, callback) {
		var geo = geocoder({
		  key: configSecrets.googleGeocodeApiKey
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