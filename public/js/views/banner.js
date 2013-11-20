define(['hbs!templates/generator_banners/banner', 'hbs!templates/generator_banners/scraping', 'hbs!templates/generator_banners/backOfficeLinks', 'hbs!templates/generator_banners/previewsBanners' ,'select2', 'uniform', 'utf8', 'ThreeAIncView'], function(bannerTemplate, scrapTemplate, showLinksTemplate, showPreviewsTemplate, select2, uniform, utf8, ThreeAIncView){
	var bannerView =Backbone.View.extend({
		el  		: $('#content'),

		events 		: {
			'click .showForm' 				: 'showForm',
			'click #scrapping-info' 				: 'getScrapping',
			'click .generate-footer' 			: 'generateFooter',
			'click .preview-footer' 				: 'generateFooter',
			'blur #liseretMonochrome'			: 'updateColorsMonochrome',
			'click #backToHome'				: 'render',
			'click #backToScrapResult'			: 'backToScrap',
			'click .back-menu-banner-generator' 		: 'render',
			'focus input'					: 'clearErrors'
		},

		showForm : function(evt){
			$(evt.target).closest("div.field-box").next('.hide').toggle();
		},

		render : function(){
			$('#error').fadeOut();
			this.threeAView= new ThreeAIncView;
			var self =this;
			this.threeAView.showAjaxBackground();
			$.ajax({
				
				url: '/getCampaigns',
				dataType: 'json'
				}).done(function(data) {
					self.threeAView.hideAjaxBackground();
					var campaigns=data;
					var out='';
					for (campaign in campaigns){
						out+="<option value="+campaigns[campaign].id+">"+utf8.decode(campaigns[campaign].name)+"</option>";
					}
					var templateConfig = {campaigns:out};
					self.$el.html(bannerTemplate(templateConfig));
					self.uniformSelect();
					self.$el.hide().fadeIn();
					self.form = $('#addApplication');
				}).error(function(){
					self.threeAView.hideAjaxBackground();
					self.showErrorMessage('Impossible de récupérer les campagnes, veuillez réessayer plus tard.');
				})
		},

		uniformSelect : function(){	
			$("input:checkbox, input:radio").uniform();
			$(".select2").select2({
				placeholder: ""
			});
		},

		getScrapping : function(e){
			$('#error').fadeOut();
			e.preventDefault();
			var self = this;
			
			var 	dataForm 	= this.form.serialize(),
				self 		=this,
				badUrl 		= false;


			var stores = $('input[name^="store["]:checked');

			if(stores.length == 0){
				this.showErrorMessage('Veuillez choisir un device');
				return;
			}

			if(stores.length > 1){
				this.showErrorMessage('Veuillez choisir un seul device à la fois');
				return;
			}
			

			$('.application-url').each(function(i){

				var isChecked = $(this).closest('.hide').prev('div').find('.checker span');

				var 	value 	= $(this).val(),
					regex 	= $(this).prop('pattern');

				var regex = new RegExp(regex);

				if(!regex.test(value) && isChecked.hasClass('checked')) {
					$(this).closest('div.field-box').addClass('error');
					$(this).next('.alert-msg').fadeIn();
					badUrl = true;
				}

			});
			
		if(!badUrl){			
			this.threeAView.showAjaxBackground();
			this.$el.fadeOut();

			$.ajax({
				url: '/getScrappingApplication',
				data : dataForm,
				dataType: 'json'
				}).done(function(scrapStore) {
					self.threeAView.hideAjaxBackground();
					scrapStore.forEach(function(scrap){


						var 	device 			= Object.keys(scrap),
							srcLogo		= scrap[device].icon,
							campaignID		= scrap[device].campaignID,
							trackLink 		= scrap[device].trackLink,
							campaignName 	= scrap[device].campaignName,
							nbComments 		= scrap[device].nbComments,
							nbStars 		= scrap[device].nbStars,
							appName 		= scrap[device].appName,
							editor 			= scrap[device].editor,
							sizes 			= scrap[device].sizes
							deviceName 		= device.toString().replace('_', ' '),
							formatStore 		= false,
							sizesStore 		= '';
							formatStoreIos7 	= false,
							sizesStoreIos7 		= '';
							formatMonochrome 	= false;
							sizesMonochrome 	= '';

							// L ajout d un nouveau type de  formats se fait ici !!
							for(i=0, formatsLength = scrap[device].formats.length; i < formatsLength; i+=1){
								if(scrap[device].formats[i].name == 'store'){
									formatStore = true;
									sizesStore = scrap[device].formats[i].sizes;
								}
								if(scrap[device].formats[i].name == 'storeios7'){
									formatStoreIos7 = true;
									sizesStoreIos7 = scrap[device].formats[i].sizes;
								}
								if(scrap[device].formats[i].name == 'monochrome'){
									formatMonochrome = true;
									sizesMonochrome = scrap[device].formats[i].sizes;
								}
							}
						
			
					
						if(typeof scrap[device].multicolor !='undefined'){
							var multiColor = true;
						}
						else{
							var multiColor = false;	
						}

						//ici aussi, on ajoute des variables au template pour l ajout de nouveaux formats !
						var templateConfig = {deviceName:deviceName, device:device, srcLogo : srcLogo, campaignID : campaignID, trackLink : trackLink, campaignName : campaignName, nbComments : nbComments, nbStars : nbStars, appName : appName, editor : editor, multiColor : multiColor, formatStore :formatStore, formatMonochrome : formatMonochrome, sizesStore : sizesStore, sizesMonochrome : sizesMonochrome,  formatStoreIos7: formatStoreIos7 , sizesStoreIos7 : sizesStoreIos7};
						self.$el.html('').append(scrapTemplate(templateConfig));
						self.errorBox = $('#error-formats');
					});
					self.uniformSelect();
					self.scrappingResult=$('.scrapping-result');
					self.$el.hide().fadeIn();	
					
					
				}).error(function(){
					self.threeAView.hideAjaxBackground();
					self.showErrorMessage('Impossible de récupérer les infos de l\'application');
				})
			}
		},


		showErrorMessage : function(msg){
			$('#error').find('i').text(msg);
			$('#error').fadeIn();
		},

		generateFooter : function(evt){
			var self = this;
			this.errorBox.find('span').remove();
			this.errorBox.hide();
			evt.preventDefault();
			$('#error').fadeOut();
			
			var  	errorFormats 		= false,
				errorGeneralInfo 	= false,
				formatsLength 	= 0,
				containerDevice 	= $(evt.target).closest('.scrapping-result'),
				formats 		= containerDevice.find($('input[name="format"]'));
			
			var generalValidation = $('#generalAppInfo').find($('input.validation'));
					if(generalValidation.length > 0){
						errorGeneralInfo=this.validateInputs(generalValidation);		
			}

			formats.each(function(i){
			
				var formatName=$(this).val();
				if($(this).prop('checked')){
					formatsLength+=1;
					
					//On check si l'utilisateur a renseigné au moins une taille.
					var sizes = $(this).closest('.customsection').find($('input[name="'+formatName+'[size]"]:checked')).length;
					if(sizes ==0){
						self.errorBox.fadeIn().append('<span> // Veuillez sélectionner au moins une taille pour chacun des formats sélectionnés</span>');
						errorFormats = true;
					}

					//On check si l utilisateur a renseigné au moins une couleur pour les formats qui en ont besoin.
					var availableColors = $(this).closest('.customsection').find($('input[name="'+formatName+'[color]"]')).length;
					if(availableColors >0){
						var colors = $(this).closest('.customsection').find($('input[name="'+formatName+'[color]"]:checked')).length;
						if(colors ==0){
							self.errorBox.fadeIn().append('<span> // Veuillez sélectionner au moins une couleur pour le(s) format(s) avec couleurs</span>');
							errorFormats = true;
						}
					}

					var validationFormatInputs = $(this).closest('.customsection').find($('input.validation'));
					if(validationFormatInputs.length > 0){
						errorFormats=self.validateInputs(validationFormatInputs);				
					}
				}
			});

			if(formatsLength == 0){
				this.errorBox.fadeIn().append('<span> // Veuillez sélectionner au moins un format</span>');
				errorFormats = true;
			}
		
			if(!errorFormats && !errorGeneralInfo){
				if($(evt.target).hasClass('preview-footer')){
					preview = 'true';
				}
				else{
					preview = 'false';
				}
				var self = this;
				this.threeAView.showAjaxBackground();
				var formData = $(evt.target).closest("form").serialize();
				formData+='&isPreview='+preview;
				$.ajax({
					url: '/generateFooters',
					data : formData,
					dataType: 'json'
					}).done(function(footers) {
						if(preview !='true'){
							self.threeAView.hideAjaxBackground();
							var templateConfig = {backOfficeLinks:footers};
							self.$el.append(showLinksTemplate(templateConfig));
						}
						else{	
							self.threeAView.hideAjaxBackground();
							var templateConfig = {previews:footers};
							self.previewResult=$('#preview-result');
							self.$el.append(showPreviewsTemplate(templateConfig));
						}
						self.scrappingResult.fadeOut(function(){
							self.$el.hide().fadeIn();	
						});
					}).error(function(err){
						console.log(err);
						self.threeAView.hideAjaxBackground();
						this.showErrorMessage('Impossible de générer les footers');
				});
			}
			
		},

		updateColorsMonochrome : function(evt){
			$('#liseretColor').val($(evt.target).val());
			$('#arrowColor').val($(evt.target).val());
		},

		backToScrap : function(){
			$('#preview-result').fadeOut(function(){
						$(this).remove();
						$('.scrapping-result').fadeIn();	
			});
		},

		validateInputs : function(inputs){

			var error = false;

			inputs.each(function(i){
				var 	value 	= $(this).val(),
					regex 	= $(this).prop('pattern');

				var regex = new RegExp(regex);

				if(!regex.test(value) ) {
					$(this).closest('div.field-box').addClass('error');
					$(this).next('.alert-msg').fadeIn();
					error =  true;
				}
				
			});

			return error;
		},
 
		clearErrors : function(evt){
			if($(evt.target).closest('.field-box').hasClass('error')){
				$(evt.target).closest('.field-box').removeClass('error');
				$(evt.target).next('.alert-msg').fadeOut();
			}	
		}
	});

	return bannerView;
});