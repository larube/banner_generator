module.exports = function (app, models) {
	app.get('/getCampaigns', function(req, res) {
			var 	curl 		= require('curlrequest'),
				configSite	= require('../settings.js');
		
			var options = {
				url: configSite.WS_GET_CAMPAIGNS
			};

			curl.request(options, function (err, data) {
				if (err){
					console.log(err);
					res.send(err);
					return;
				}
				res.send(data);
			});	
		});
};