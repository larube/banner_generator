define(['hbs!templates/generator_banners/banner', 'hbs!templates/generator_banners/scraping', 'hbs!templates/generator_banners/backOfficeLinks', 'hbs!templates/generator_banners/previewsBanners' ,'select2', 'uniform', 'utf8', 'jqueryForm', 'ThreeAIncView'], function(bannerTemplate, scrapTemplate, showLinksTemplate, showPreviewsTemplate, select2, uniform, utf8, jqueryForm, ThreeAIncView){
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
			'focus input'					: 'clearErrors',
			'change .input-file-validation'			: 'clearErrorInputFile',
			'mouseover .fx-transition label'		: 'showTransitionPreview',
			'mouseout .fx-transition label'			: 'hideTransitionPreview'
		},

		showForm : function(evt){
			$(evt.target).closest("div.field-box").next('.hide').toggle();
		},

		render : function(){
			$('#error').fadeOut();
			var self =this;
			ThreeAIncView.showAjaxBackground();
			$.ajax({
				url: '/getCampaigns',
				dataType: 'json'
				}).done(function(data) {
					ThreeAIncView.hideAjaxBackground();
					var campaigns=data;
					var out='';
					for (campaign in campaigns){
						out+="<option value="+campaigns[campaign].id+">"+utf8.decode(campaigns[campaign].name)+"</option>";
					}
					var templateConfig = {campaigns:out};
					self.$el.html(bannerTemplate(templateConfig));
					ThreeAIncView.uniformSelect();
					self.$el.hide().fadeIn();
					self.form = $('#addApplication');
				}).error(function(){
					ThreeAIncView.hideAjaxBackground();
					self.showErrorMessage('Impossible de récupérer les campagnes, veuillez réessayer plus tard.');
				})
		},

		getScrapping : function(e){
			$('#error').fadeOut();
			e.preventDefault();
			
			var 	dataForm 	= this.form.serialize(),
				self 		=this,
				badUrl 		= false;

			//Check combien  de devices demande l user, on en veut qu un seul
			var stores = $('input[name^="store["]:checked');
			if(stores.length != 1){
				this.showErrorMessage('Veuillez choisir UN device');
				return;
			}

			$('.application-url').each(function(i){
				var 	isChecked 	= $(this).closest('.hide').prev('div').find('.checker span');
					value 		= $(this).val(),
					regex 		= $(this).prop('pattern');

				var regex = new RegExp(regex);

				if(!regex.test(value) && isChecked.hasClass('checked')) {
					$(this).closest('div.field-box').addClass('error');
					$(this).next('.alert-msg').fadeIn();
					badUrl = true;
				}
			});
			
		if(!badUrl){			
			ThreeAIncView.showAjaxBackground();
			this.$el.fadeOut();

			$.ajax({
				url: '/getScrappingApplication',
				data : dataForm,
				dataType: 'json'
				}).done(function(scrapStore) {
					ThreeAIncView.hideAjaxBackground();
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
							formatSecondClick 	= false;
							sizesSecondClick 	= '';

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
								if(scrap[device].formats[i].name == 'secondClick'){
									formatSecondClick = true;
									sizesSecondClick = scrap[device].formats[i].sizes;
								}
							}

						var multiColor = typeof scrap[device].multicolor !='undefined';

						//ici aussi, on ajoute des variables au template pour l ajout de nouveaux formats !
						var templateConfig = {deviceName:deviceName, device:device, srcLogo : srcLogo, campaignID : campaignID, trackLink : trackLink, campaignName : campaignName, nbComments : nbComments, nbStars : nbStars, appName : appName, editor : editor, multiColor : multiColor, formatStore :formatStore, formatMonochrome : formatMonochrome, sizesStore : sizesStore, sizesMonochrome : sizesMonochrome,  formatStoreIos7: formatStoreIos7 , sizesStoreIos7 : sizesStoreIos7, formatSecondClick: formatSecondClick,  sizesSecondClick: sizesSecondClick};
						self.$el.html('').append(scrapTemplate(templateConfig));
						self.errorBox = $('#error-formats');
					});
					ThreeAIncView.uniformSelect();
					self.scrappingResult=$('.scrapping-result');
					self.$el.hide().fadeIn();	
					
				}).error(function(){
					ThreeAIncView.hideAjaxBackground();
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
			
			var generalValidation = $('#uploadImageBannerForm').find($('input.validation'));
					if(generalValidation.length > 0){
						errorGeneralInfo=ThreeAIncView.validateInputs(generalValidation);		
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

					//On check si l utilisateur a renseigné aune image à uploader pour les formats qui en besopin.
					var inputFile = $(this).closest('.customsection').find($('input[name$="[customImage]"]'));
					if(inputFile.val() ==''){
						errorFormats = true;
						inputFile.closest('div.field-box').addClass('error');
						inputFile.next('br').next('.alert-msg').fadeIn();
					}

					//On check si l utilisateur a renseigné au moins un effet de transition pour les formats qui en ont besoin.
					var availableTransitions = $(this).closest('.customsection').find($('input[name="'+formatName+'[transitionFx]"]')).length;
					if(availableTransitions >0){
						var colors = $(this).closest('.customsection').find($('input[name="'+formatName+'[transitionFx]"]:checked')).length;
						if(colors ==0){
							self.errorBox.fadeIn().append('<span> // Veuillez sélectionner au moins un effet pour le(s) format(s) avec transition</span>');
							errorFormats = true;
						}
					}

					//Check des inputs ayant une classe "validation"
					var validationFormatInputs = $(this).closest('.customsection').find($('input.validation'));
					if(validationFormatInputs.length > 0){
						errorFormats=ThreeAIncView.validateInputs(validationFormatInputs);				
					}
				}
			});

			if(formatsLength == 0){
				this.errorBox.fadeIn().append('<span> // Veuillez sélectionner au moins un format</span>');
				errorFormats = true;
			}
		
			if(!errorFormats && !errorGeneralInfo){
				ThreeAIncView.showAjaxBackground();
				var	preview 	= $(evt.target).hasClass('preview-footer') ? 'true' : 'false';
					self 		= this
					formData 	= $(evt.target).closest("form").serialize();					
				formData+='&isPreview='+preview;

				var options  = {
					data : {formData: formData},
					error: function(err) {
									console.log(err);
									ThreeAIncView.hideAjaxBackground();
									self.showErrorMessage('Impossible de générer les footers');	
								},
					success: function(footers) {
						
									if(preview !='true'){
										ThreeAIncView.hideAjaxBackground();
										var templateConfig = {backOfficeLinks:footers};
										self.$el.append(showLinksTemplate(templateConfig));
									}
									else{	
										ThreeAIncView.hideAjaxBackground();
										console.log(footers);
										var templateConfig = {previews:footers};
										self.previewResult=$('#preview-result');
										self.$el.append(showPreviewsTemplate(templateConfig));
									}
									self.scrappingResult.fadeOut(function(){
										self.$el.hide().fadeIn();	
									});
								}
				};
				$(evt.target).closest("form").ajaxSubmit(options);
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

		clearErrors : function(evt){
			ThreeAIncView.fadeOutErrors(evt);
		},

		clearErrorInputFile : function(evt){
			$(evt.target).closest('div.field-box').find('.alert-msg').fadeOut();
		},

		showTransitionPreview : function(evt){
			var iframe = $(evt.target).find('div.previewTransition').find('iframe');
			iframe.attr('src', iframe.attr('src'));
			$(evt.target).find('div.previewTransition').show();

		},

		hideTransitionPreview : function(evt){
			$(evt.target).find('div.previewTransition').hide();			
		}
	});

	return bannerView;
});