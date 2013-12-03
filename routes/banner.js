module.exports = function (app, models) {

	app.post('/generateFooters', function (req, res){
		//IMPORTANT !!!! Ne pas supprimer, time out de 6 minutes pour créer un maximum de bannières 
		res.connection.setTimeout(600000);
		var 	bannerConstructor 	= require('banner_generator'),
			configSite		= require('../settings.js'),
			fs 			= require('fs'),
			gsUtils 			= require('gs_utils'),
			sanitizer 		= require('sanitizer'),
			curl 			= require('curlrequest'),
			crypto			= require('crypto'),
			imageinfo 		= require('imageinfo'),
			imageMagick 		= require('imagemagick'),
			querystring 		= require('querystring'),
			query 			= req.body,
			formats 		= [],
			banners 		= [],
			adUnitsCreated 	= [],
			linksPreviews 		= [],
			logoPath 		= query.logo;


		//Si un seul format demandé 
		if (typeof query.format == 'string'){
			var format = query.format;
			query.format = [];
			query.format.push(format);
		}

		//Si c est une preview qui est demandée
		var isPreview = querystring.parse(query.formData).isPreview == 'true' ? true : false; 

		//Traitement du formulaire de l utilisateur
		Object.keys(query.format).forEach(function(i){
			var formatToGenerate = query.format[i];
			var nameFormat  = formatToGenerate+'_'+query.device;
			query[formatToGenerate].color = typeof  query[formatToGenerate].color == 'string' ? [query[formatToGenerate].color] : query[formatToGenerate].color; 

			//Si couleurs 
			if(typeof query[formatToGenerate] !='undefined'){
				if(typeof query[formatToGenerate].color !='undefined'){

					Object.keys(query[formatToGenerate].color).forEach(function(j){
						var newFormat = {};
						var nameFormat  = formatToGenerate+'_'+query.device+'_'+query[formatToGenerate].color[j];
						newFormat.nameFormat = nameFormat;
						if(typeof query[formatToGenerate].size !='string'){
							Object.keys(query[formatToGenerate].size).forEach(function(k){
								newFormat.size = query[formatToGenerate].size;
							});
								formats.push(newFormat);
						}
						else{
							newFormat.size = query[formatToGenerate].size;
							formats.push(newFormat);
						}
						
					});
				}
				else
				{
					var newFormat = {};
					newFormat.nameFormat = nameFormat;
					if(typeof query[formatToGenerate].size !='string'){
						Object.keys(query[formatToGenerate].size).forEach(function(j){
								newFormat.size = query[formatToGenerate].size;
							});
								formats.push(newFormat);
					}
					else{
							newFormat.size = query[formatToGenerate].size;
							formats.push(newFormat);
					}
				}
			}
		});

		saveLogo(logoPath, createAllBannerOptions);

		/**
		 * [creates all the options for the banners to be created]
		 * @param  {string} nameLogo 	[path to the image logo downloaded on the server]
		 * @return {[type]}          		[description]
		 */
		function createAllBannerOptions(nameLogo){
			for(format in formats){
				var 	configFormat 		= formats[format].nameFormat+'.json',
					config 			= JSON.parse(fs.readFileSync(configSite.PROJECT_DIR+'/config/banner_config/'+configFormat, 'utf8')),
					formatName 		= (formats[format].nameFormat.split('_'))[0];

				if(typeof formats[format].size == 'object'){
					for (var i=0, sizeLength = formats[format].size.length; i<sizeLength;i+=1){
							var size =formats[format].size[i];
							var bannerOptions = createBannerOptions(size, config, formatName);
						}
				}
				else{
					var size = formats[format].size;
					var bannerOptions = createBannerOptions(size, config, formatName);
				}
			}
			
			//Une fois que j ai crée mon tab de formats, je lmance une fonction qui crée chacun à son tour les bannières
			processNextBanner(banners, nameLogo);
		}

		/**
		 * [creates general options for the banner]
		 * @param  {number} size       	[banner's height]
		 * @param  {json} config     		[general options of the banner defined in the configuration file]
		 * @param  {[type]} formatName 	[banner type]
		 * @return {[type]}            		[description]
		 */
		function createBannerOptions(size, config, formatName){

			var 	banner 		= [],
				bannerOptions 	= {};
			bannerOptions.lang 	= query.lang;
			bannerOptions.size 	= size;
			bannerOptions.format = formatName;
			bannerOptions= buildOptions(query, config, bannerOptions, formatName);
			banner.config = config;
			banner.options = bannerOptions;

			banners.push(banner);
		}

		/**
		 * [Creates an object with the options for the banner]
		 * @param  {string} query         	[user's query]
		 * @param  {json} config        		[general options of the banner defined in the configuration file]
		 * @param  {array} bannerOptions 	[banner options]
		 * @param  {string} format        	[banner type]
		 * @return {array}               		[banner options]
		 */
		function buildOptions(query, config, bannerOptions, format){

			bannerOptions.customImage 	= req.files && req.files[format] && req.files[format].customImage && req.files[format].customImage.path,
			bannerOptions.clickPixelLink 	= typeof query[format].clickPixelLink !='undefined' ? query[format].clickPixelLink : '';
			bannerOptions.cssTransition 	= typeof query[format].transitionFx !='undefined' ? query[format].transitionFx : '';
			
			if (typeof query.texts != 'undefined' && typeof config[bannerOptions.size].texts !='undefined'){
				var texts = Object.keys(query.texts);
							bannerOptions.texts = {};
							for (text in texts){
								var textToInsert = texts[text];
								if(typeof config[bannerOptions.size].texts[textToInsert] !='undefined' && typeof config[bannerOptions.size].texts[textToInsert] !=''){
									bannerOptions.texts[textToInsert] = query.texts[textToInsert];
								}
							}
			}

			if (typeof query.extras != 'undefined' && typeof config[bannerOptions.size].extras !='undefined'){
				var extras = Object.keys(query.extras);
					bannerOptions.extras = {};
					for (extra in extras){
						var extraName = extras[extra];
						if(typeof config[bannerOptions.size].extras[extraName] !='undefined' && typeof config[bannerOptions.size].extras[extraName] !=''){
							bannerOptions.extras[extraName] = query.extras[extraName];
						}
					}
			}

			if (typeof query[format].texts != 'undefined'){
				var customTexts = Object.keys(query[format].texts);
					for (customText in customTexts){
						var textToInsert = customTexts[customText];
						if(typeof config[bannerOptions.size].texts[textToInsert] !='undefined' && typeof config[bannerOptions.size].texts[textToInsert] !=''){
							bannerOptions.texts[textToInsert] = query[format].texts[textToInsert];
						}
					}
			}

			if (typeof query[format].extras != 'undefined'){
				var customExtras = Object.keys(query[format].extras);
					if (typeof bannerOptions.extras =='undefined'){
						bannerOptions.extras = {};
					}
					for (customExtra in customExtras){
						var extraName = customExtras[customExtra];
						if(typeof config[bannerOptions.size].extras[extraName] !='undefined' && typeof config[bannerOptions.size].extras[extraName] !=''){
							bannerOptions.extras[extraName] = query[format].extras[extraName];
						}
					}
			}

			return bannerOptions;
		}

		/**
		 * [entry point for creating a new banner]
		 * @param  {object} banners     	[contains all the banners to be created]
		 * @param  {string} nameLogo    	[path to the logo]
		 * @param  {string} returnValue 	[id of the adUnit created OR base64 data if PREVIEW mode is on]
		 * @return {[type]}             		[description]
		 */
		function processNextBanner(banners, nameLogo, returnValue){
			//Si ce n est la première bannière, on a un retour à stocker
			if(typeof returnValue !='undefined'){
				//Si mode PREVIEW, c est un string base 64 qui représente la bannière sur un fond
				if(isPreview == true){
					var link={};
					link.src = returnValue;
					linksPreviews.push(link);
				}
				else{
					//Sinon c est l ID de l adUnit créée.
					var stringToReplace = '"';
					var replace = new RegExp(stringToReplace,"g");
					returnValue = returnValue.replace( replace, '');
					var link={};
					link.title = configSite.LINK_TO_AD_UNIT+Number(returnValue);
					adUnitsCreated.push(link);
				}
			}

			//Si c est la dernière bannière qui a été créée
			if(banners.length == 0){
				//Suppression du logo
				fs.unlinkSync(configSite.PROJECT_DIR+'/'+configSite.TEMP_IMAGES+nameLogo);
				if(isPreview == true){
					res.send(linksPreviews);
				}
				else{
					res.send(adUnitsCreated);
				}
				return;
			}else{
				//Sinon, on charge la suivante bannière
				//Si on a une custom image uploadée par l user, on procède à l upload  ici :
				if (typeof banners[0].options.customImage != 'undefined' && !isPreview){
					uploadCustomImage(banners[0]);
				}
				else{
					createBannerImage(banners[0], nameLogo);
				}
			}
		}

		/**
		 * [Creates a banner]
		 * @param  {[obj]} banner   		[current banner being processed]
		 * @param  {[tring]} nameLogo 	[global var, random name given to the logo]
		 * @return {[type]}          		[description]
		 */
		function createBannerImage(banner, nameLogo){
			//Callback diiférent selon si c'est une preview ou une création de bannière avec upload
			if(isPreview== true){
				var callbackImageCreation = pasteImageOnBackroundForPreview;
			}
			else{
				var callbackImageCreation = uploadImage;	
			}
			 var banner = new bannerConstructor (banner, configSite.PROJECT_DIR, configSite.TEMP_IMAGES, nameLogo, banners, callbackImageCreation);
		}

		/**
		 * [Paste a banner on a background for a client preview]
		 * @param  {string} srcImage 	[path to the banner created]
		 * @return {type}          		[description]
		 */
		function pasteImageOnBackroundForPreview(srcImage){

			var 	bannerHeight 		= Number(banners[0].options.size),
		 		srcBackground 	= configSite.PROJECT_DIR+'/'+banners[0].config.backgroundPreviewImage.replace('{language}', query.lang);

		 	//Recupère les infos de l image qui sert de background
			fs.readFile(srcBackground, function(err, data){
				 var 	infoImage 		= imageinfo(data),
					backgroundHeight 	= infoImage.height,
				 	distYToCopy		= Number(backgroundHeight-bannerHeight),
				  	distXToCopy		= 0;

				 //Si  l image de background a une marge en bas (notamment pour les previews iOs)
				 if(typeof banners[0].config.bottomMarginHeightPreview!='undefined'){
				 	distYToCopy-= banners[0].config.bottomMarginHeightPreview;
				 }

				  //Si  l image de background a une marge en bas (notamment pour les previews iOs)
				 if(typeof banners[0].config.leftMarginHeightPreview!='undefined'){
				 	distXToCopy= banners[0].config.leftMarginHeightPreview;
				 }


				 //Creation du nom de la preview, string au hasrard
				var shasum = crypto.createHash('sha1');
				var random = shasum.digest('hex');
				var previewImageName = 'preview_'+random+'.png';

				//Paste the banner on the background
				imageMagick.composite(['-geometry', '+'+distXToCopy+'+'+Number(distYToCopy)+'', srcImage, srcBackground ,configSite.PROJECT_DIR+'/'+configSite.TEMP_IMAGES+previewImageName],
				function(err, stdout, stderr){
					if (err) 
					{
						throw err;
					}
					console.log('>> create Preview');
	    				
	    				//On convertit l image en base64 et on la supprime et aussi la bannière qui a servi de modèle.
					fs.readFile(configSite.PROJECT_DIR+'/'+configSite.TEMP_IMAGES+previewImageName, function(err, data){
							var src = "data:image/png;base64," + new Buffer(data).toString('base64');
							fs.unlinkSync(configSite.PROJECT_DIR+'/'+configSite.TEMP_IMAGES+previewImageName);
							fs.unlinkSync(srcImage);
							delete (banners[0]);
							banners.splice(0,1);
							processNextBanner(banners, nameLogo, src);	
					});
				});
			});
			
		}

		/**
		 * [uploads the banner on the storage]
		 * @param  {string} srcImage 	[path to image]
		 * @return {type}          		[description]
		 */
		function uploadImage(srcImage){
			//Creation du nom du nouveau bucket : Schema : bucketBannersName/EditorName/CampaignName/ImagesFolderName/
			var bucketName = configSite.BUCKET_BANNERS+'/'+sanitizer.sanitizeFilename(query.texts.editor.content)+'/'+sanitizer.sanitizeFilename(query.campaignName)+'/'+configSite.STORAGE_IMAGES_NAME+'/';
			gsUtils.uploadImage(configSite.PATH_TO_GS, srcImage, bucketName, createBannerHtml, configSite.STORAGE_BASE_URL);
		}

		/**
		 * [uploads the banner on the storage]
		 * @param  {string} srcImage 	[path to image]
		 * @return {type}          		[description]
		 */
		function uploadCustomImage(banner){
			var 	shasum 	= crypto.createHash('sha1'),
				random 	= shasum.digest('hex')
				nameImage  	= 'custom_'+random.substring(0,10)+'.png',
				bucketName 	= configSite.BUCKET_BANNERS+'/'+sanitizer.sanitizeFilename(query.texts.editor.content)+'/'+sanitizer.sanitizeFilename(query.campaignName)+'/'+configSite.STORAGE_IMAGES_NAME+'/';
				tempPath 	= banner.options.customImage;
    				savePath 	=  configSite.TEMP_IMAGES + nameImage;

			fs.rename(tempPath, savePath, function(error){
				if(error)
				{
					throw error;
				}
				fs.unlink(tempPath, function(){
					if(error)
					{
						throw error;
					}
						fs.readFile(savePath, function(err, data){
							gsUtils.uploadImage(configSite.PATH_TO_GS, savePath, bucketName, saveCustomImageLink, configSite.
								STORAGE_BASE_URL);
						});

					});
			});
		}

		function saveCustomImageLink(srcCustomImage){
			banners[0].options.pathToCustomImage = srcCustomImage;
			createBannerImage(banners[0], nameLogo);
		}


		/**
		 * [Creates the html for a banner]
		 * @param  {string} linkToImage 	[path to the image on the storage]
		 * @return {type}             		[description]
		 */
		function createBannerHtml(linkToImage){
			var 	size 			= banners[0].options.size,
				format 			= banners[0].options.format,
				templatePath 		= configSite.PROJECT_DIR+'/'+banners[0].config.htmlTemplate,
				htmlTemplate 		= '';

			fs.readFile(templatePath, 'utf8', function (err, data) {
				if (err){
					throw err;
				}
				htmlTemplate=data;

				//S il y a des variables HTML ds le config du template
				if(typeof banners[0].config[size].htmlVars != 'undefined'){

					for (var i=0, htmlVarsLength = Object.keys(banners[0].config[size].htmlVars).length; i < htmlVarsLength; i+=1 ){
					
						var key = Object.keys(banners[0].config[size].htmlVars)[i];
						var value = banners[0].config[size].htmlVars[key];

						if(typeof query[format].htmlVars[key] !='undefined'){
							var 	valueToReplace = key.split('-');
								valueToReplace = '{'+valueToReplace[valueToReplace.length-1]+'}';
								value =  banners[0].config[size].htmlVars[key].replace(valueToReplace, query[format].htmlVars[key]);
						}
						var stringToReplace = '{{[ ]*'+key+'[ ]*}}';
						var replace = new RegExp(stringToReplace,"g");
						htmlTemplate = htmlTemplate.replace( replace, value);
					}
				}

				//Cas d une image uoploadée par l user
				if(typeof banners[0].options.pathToCustomImage !='undefined' && banners[0].options.pathToCustomImage!=''){
					var stringToReplace = '{{[ ]*pathToCustomImage[ ]*}}';
					var replace = new RegExp(stringToReplace,"g");
					htmlTemplate = htmlTemplate.replace(replace, banners[0].options.pathToCustomImage);	
				}



				//Injection du link de redirection
				var stringToReplace = '{{[ ]*redirectLink[ ]*}}';
				var replace = new RegExp(stringToReplace,"g");
				htmlTemplate = htmlTemplate.replace(replace, query.trackLink);

				//Injection de la bannière créée
				var stringToReplace = '{{[ ]*pathToBanner[ ]*}}';
				var replace = new RegExp(stringToReplace,"g");
				htmlTemplate = htmlTemplate.replace(replace, linkToImage);

				//Injection d un éventuel pixel d impression
				if(typeof banners[0].options.clickPixelLink !='undefined' && banners[0].options.clickPixelLink !=''){
					var stringToReplace = '{{[ ]*clickPixelLink[ ]*}}';
					var replace = new RegExp(stringToReplace,"g");
					htmlTemplate = htmlTemplate.replace(replace, banners[0].options.clickPixelLink);
				}

				//Injection d'éventulles animations transtions CSS3
				if(typeof banners[0].options.cssTransition !='undefined' && banners[0].options.cssTransition !='')
				{
					cssTransiton = banners[0].options.cssTransition;
					var transitions	= JSON.parse(fs.readFileSync(configSite.PROJECT_DIR+'/config/banner_config/fx/fx_transition_second_click.json', 'utf8'));
						var rules = transitions[cssTransiton];
						for(key in rules["stage1"]){
							var stageOne = rules["stage1"];
							var stringToReplace = '{{[ ]*'+key+'[ ]*}}';
							var replace = new RegExp(stringToReplace,"g");
							htmlTemplate = htmlTemplate.replace(replace, stageOne[key]);
						}

						for(key in rules["stage2"]){
							var stageOne = rules["stage2"];
							var stringToReplace = '{{[ ]*'+key+'[ ]*}}';
							var replace = new RegExp(stringToReplace,"g");
							htmlTemplate = htmlTemplate.replace(replace, stageOne[key]);
						}						
				}

				//Injection du JS
				injectJavaScript(htmlTemplate);
			});		
		}

		/**
		 * [injects Communicate Script in the HTML]
		 * @param  {string} htmlTemplate 	[banner's HTML]
		 * @return {}              			[description]
		 */
		function injectJavaScript(htmlTemplate){
			var 	curl 		= require('curlrequest');
	
			var options = {
				url: configSite.COMMUNICATE_URL
			};

			curl.request(options, function (err, communicateScript) {
				var stringToReplace = '{{[ ]*communicateScript[ ]*}}';
				var replace = new RegExp(stringToReplace,"g");
				htmlTemplate = htmlTemplate.replace(replace, communicateScript);
				uploadHtml(htmlTemplate);

			});
		}

		/**
		 * [uploadHtml banner's HTML to the storage]
		 * @param  {string} htmlTemplate 	[banner's HTML]
		 * @return {[type]}              		[description]
		 */
		function uploadHtml(htmlTemplate){
			//Creation du nom du nouveau bucket : Shema : bucketBannersName/EditorName/CampaignName/FramesFolderName/
			var bucketName = configSite.BUCKET_BANNERS+'/'+sanitizer.sanitizeFilename(query.texts.editor.content)+'/'+sanitizer.sanitizeFilename(query.campaignName)+'/'+configSite.STORAGE_FRAMES_NAME+'/';

			var filename = banners[0].config.name+'_'+sanitizer.sanitizeFilename(query.texts.appName.content)+'_'+banners[0].options.lang+'_'+banners[0].options.size+'.html';
			//Création d un fichier temporaire qui stocke le html
			var file = configSite.PROJECT_DIR+'/'+configSite.TEMP_HTML+'/'+filename;
			fs.writeFile(file, htmlTemplate, function(err) {
				if(err) {
					console.log(err);
				} else {
					gsUtils.uploadHtml(configSite.PATH_TO_GS, file, bucketName, createAdUnit, configSite.STORAGE_BASE_URL);
				}
			}); 
		}

		/**
		 * [creates a new AdUnit on the Backoffice]
		 * @param  {string} srcHtml 	[path to the HTML banner on the storage]
		 * @return {[type]}         	[description]
		 */
		function createAdUnit(srcHtml){
			var 	chtml 		= "'"+srcHtml+"'";
				type 		= 3,
				width 		= banners[0].config.bannerWidth,	
				height 		= banners[0].options.size,
				format 	= "'footer'",
				name 		= "'"+banners[0].config.backofficeName.replace('{{size}}', banners[0].options.size)+"'",
				//Status 2 par défaut,  ce st à dire en pause
				status 		= 2,
				campaigns_FK= query.campaignID,
				click_url	 = "'"+query.trackLink+"'";
				
				var post_click ='{"side":"left","type":"redirect", "src":"'+query.trackLink+'","link":"'+query.trackLink+'","embedded":"non", "effect":"flip","background":"", "icon":"","name":"","editor":"","banner":"","desc":"","screens":"","content":""}';

				post_click="'"+post_click+"'";

				var options = {
					url: configSite.WS_POST_AD_UNIT,
					method : 'POST',
					data : {"chtml" : chtml, "type": type, "width" : width, "height" : height ,"format": format, "post_click" : post_click, "name" : name, "status" : status, "campaigns_FK" : campaigns_FK , "click_url":click_url} ,
					verbose : true
				};

				curl.request(options, function (err, idAdUnit) {
					if (err ) throw err;
					//Suppression de l entree de la banniere traitée
					delete (banners[0]);
					banners.splice(0,1);

					//Bannière suivante
					processNextBanner(banners, nameLogo, idAdUnit);	
				});
		}

		/**
		 * [gets the application logo and writes it with a random name]
		 * @param  {string}   url      		[path to the logo on the web]
		 * @param  {Function} callback 	[function called after saving the logo]
		 * @return {[type]}            		[description]
		 */
		function saveLogo(url, callback){
			var shasum = crypto.createHash('sha1');
			var random = shasum.digest('hex');
			nameLogo = 'logo_'+random+'.png' ;
			var http = require('http-get');
			var options = {url: url };
			http.get(options, configSite.TEMP_IMAGES+nameLogo, function (error, result) {
				if (error) {
					console.error(error);
					res.send('Impossible de sauvegarder le logo de l application, veuillez réessayer')
					return;
				} else {
					callback(nameLogo);
				}
			});
		}

	});

	app.post('/uploadCustomImageBanner', function(req, res){
		var 	configSite		= require('../settings.js'),
			fs 			= require('fs'),
			gsUtils 			= require('gs_utils'),
			sanitizer 		= require('sanitizer'),
			curl 			= require('curlrequest'),
			crypto			= require('crypto'),
			imageinfo 		= require('imageinfo'),
			imageHeight 		= 0,
			imageWidth 		= 0,
			adUnitsCreated 	= [];
	
		var tempPath = req.files.customImage.path;
    		var savePath =  configSite.TEMP_IMAGES + req.files.customImage.name;

		fs.rename(tempPath, savePath, function(error){
			if(error)
			{
				throw error;
			}
			fs.unlink(tempPath, function(){
				if(error)
				{
					throw error;
				}
					fs.readFile(savePath, function(err, data){
						var 	infoImage 		= imageinfo(data);

						imageHeight 		= infoImage.height,
						imageWidth 		= infoImage.width;

						//Todo : gérer les mauvais formats  d'images;
						
						//Creation du nom du nouveau bucket : Schema : bucketBannersName/EditorName/CampaignName/ImagesFolderName/
						var bucketName = configSite.BUCKET_BANNERS+'/'+sanitizer.sanitizeFilename(req.body.clientName)+'/'+sanitizer.sanitizeFilename(req.body.campaignName)+'/'+configSite.STORAGE_IMAGES_NAME+'/';
						
						gsUtils.uploadImage(configSite.PATH_TO_GS, savePath, bucketName, createCustomImageBannerHtml, configSite.
							STORAGE_BASE_URL);
					});

				});

		});    

		
		function createCustomImageBannerHtml(linkToImage){
			var 	templatePath 	= configSite.PROJECT_DIR+'/'+configSite.BANNERS_TEMPLATES+'customImageBannerTemplate.html',
				htmlTemplate 	= '';

			fs.readFile(templatePath, 'utf8', function (err, data) {
				if (err){
					throw err;
				}
				htmlTemplate=data;

				//Injection de l image créée
				var stringToReplace = '{{[ ]*pathToBanner[ ]*}}';
				var replaceImage = new RegExp(stringToReplace,"g");
				htmlTemplate = htmlTemplate.replace(replaceImage, linkToImage);

				//Injection d un éventuel pixel d impression 
				if(typeof  req.body.pixelImpression!='undefined' &&  req.body.pixelImpression!=''){
					var pixelLink = '{{[ ]*linktoPixel[ ]*}}'
					var replacePixel = new RegExp(pixelLink,"g");
					htmlTemplate = htmlTemplate.replace(replacePixel, req.body.pixelImpression);
				}

				//Injection du JS
				injectJavaScript(htmlTemplate);
			});
		}

		/**
		 * [injects Communicate Script in the HTML]
		 * @param  {string} htmlTemplate 	[banner's HTML]
		 * @return {}              			[description]
		 */
		function injectJavaScript(htmlTemplate){
			var 	curl 		= require('curlrequest');
	
			var options = {
				url: configSite.COMMUNICATE_URL
			};

			curl.request(options, function (err, communicateScript) {
				var stringToReplace = '{{[ ]*communicateScript[ ]*}}';
				var replace     = new RegExp(stringToReplace,"g");
				htmlTemplate = htmlTemplate.replace(replace, communicateScript);
				uploadHtml(htmlTemplate);

			});
		}

		/**
		 * [uploadHtml banner's HTML to the storage]
		 * @param  {string} htmlTemplate 	[banner's HTML]
		 * @return {[type]}              		[description]
		 */
		function uploadHtml(htmlTemplate){
			//Creation du nom du nouveau bucket : Shema : bucketBannersName/EditorName/CampaignName/FramesFolderName/
			var bucketName = configSite.BUCKET_BANNERS+'/'+sanitizer.sanitizeFilename(req.body.clientName)+'/'+sanitizer.sanitizeFilename(req.body.campaignName)+'/'+configSite.STORAGE_FRAMES_NAME+'/';

			var filename = sanitizer.sanitizeFilename(req.body.formatName)+'_'+sanitizer.sanitizeFilename(req.body.clientName)+'.html';
			//Création d un fichier temporaire qui stocke le html
			var file = configSite.PROJECT_DIR+'/'+configSite.TEMP_HTML+'/'+filename;
			fs.writeFile(file, htmlTemplate, function(err) {
				if(err) {
					console.log(err);
				} else {
					gsUtils.uploadHtml(configSite.PATH_TO_GS, file, bucketName, createAdUnitForCustomImage, configSite.STORAGE_BASE_URL);
				}
			}); 
		}

		function createAdUnitForCustomImage(srcHtml){
			var 	chtml 		= "'"+srcHtml+"'";
				type 		= 3,
				width 		= imageWidth,	
				height 		= imageHeight,
				format 	="'footer'",
				name 		= "'"+req.body.formatName+"'",
				//Status 2 par défaut,  'c e'st à dire en pause
				status 		= 2,
				campaigns_FK = req.body.campaignID,
				click_url	= "'"+req.body.trackLink+"'";
			
			var post_click ='{"side":"left","type":"redirect", "src":"'+req.body.trackLink+'","link":"'+req.body.trackLink+'","embedded":"non", "effect":"flip","background":"", "icon":"","name":"","editor":"","banner":"","desc":"","screens":"","content":""}';

			post_click="'"+post_click+"'";

			var options = {
				url: configSite.WS_POST_AD_UNIT,
				method : 'POST',
				data : {"chtml" : chtml, "type": type, "width" : width, "height" : height ,"format": format, "post_click" : post_click, "name" : name, "status" : status, "campaigns_FK" : campaigns_FK , "click_url":click_url} ,
				verbose : true
			};

			curl.request(options, function (err, idAdUnit) {
				if (err ){
					 throw err;
				}
				//TODO : UNLINK evreything
				
				var stringToReplace = '"';
					var replace = new RegExp(stringToReplace,"g");
					idAdUnit = idAdUnit.replace( replace, '');
					var link={};
					link.title = configSite.LINK_TO_AD_UNIT+Number(idAdUnit);
					adUnitsCreated.push(link);
				res.send(adUnitsCreated);
				return;
			});
		}

	});
}