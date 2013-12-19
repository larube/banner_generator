module.exports = function(app, models) {

	var 	ScrappingApplication 	= require('scrapping');
		
	app.get('/getScrappingApplication', function(req, res) {
		var 	query 		= req.query,
			deviceStore 	= require('../config/device_store.json'),
			scrappingRes 	= [],
			callsStores 	=[], 
			stores 		=[];

		//Stores dispos
		fs.readdirSync('./node_modules/scrapping/lib').forEach(function(file) {
			if ( file[0] == '.' ) return;
			stores.push(file);
		});

		var 	device = {};
			device.storeToCall 	= deviceStore[query.device];
			device.name 		=  query.device; 
		
		getInfoStore(device);
		

		function getInfoStore(store){

			var scrap = new ScrappingApplication(query.link[store.name], store.storeToCall, function(result){

				
				var scrap = {};
				scrap[store.name] 				= result;
				scrap[store.name].campaignID		= query.campaign[store.name];
				scrap[store.name].trackLink			= query.track[store.name];
				scrap[store.name].campaignName		=query.campaignName[store.name];
				if(typeof query.multicolor[store.name]!='undefined'){
					scrap[store.name].multicolor 	=true;
				}

				scrap[store.name].formats 	=[];
				var formats = query.formats[store.name].split(':');

				for(j=0, formatsLength = formats.length; j < formatsLength;j+=1){
					var format = {};
					format.name = formats[j];
					scrap[store.name].formats.push(format);
					if(typeof query.sizes[formats[j]][store.name]!='undefined'){
						scrap[store.name].formats[formats[j]] =[];
						scrap[store.name].formats[j].sizes =[];
						var sizes = query.sizes[formats[j]][store.name].split(':');
						for(i=0, sizesLength = sizes.length;  i < sizesLength;i+=1){
							var size = {};
							size.size = sizes[i];
							scrap[store.name].formats[j].sizes.push(size);
						}
					}
				}

				var stars 				= Number(scrap[store.name].nbStars); 
				delete scrap[store.name].nbStars;
				scrap[store.name].nbStars 			=Math.ceil(stars*2) / 2;
				scrappingRes.push(scrap);
				res.send(scrappingRes);
			});
		}
		
	});
}