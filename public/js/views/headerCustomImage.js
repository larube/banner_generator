define(['hbs!templates/generator_custom_image_headers/customImageHeader', 'hbs!templates/generator_custom_image_headers/showLinkTemplate', 'select2', 'uniform', 'utf8', 'jqueryForm', 'ThreeAIncView'], function(customImageHeaderTemplate, showLinkTemplate, select2, uniform, utf8, jqueryForm, ThreeAIncView){
	var HeaderCustomImageView =Backbone.View.extend({
		el  		: $('#content'),

		events 		: {
			'submit #uploadImageBannerForm' 	: 'uploadCustomImage',
			'click .backCutomImageForm' 	: 'backToForm',
			'focus input'				: 'clearErrors',
			'change #customImage'		: 'clearErrorInput'
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
					self.$el.html(customImageHeaderTemplate(templateConfig));
					ThreeAIncView.uniformSelect();
					self.$el.hide().fadeIn();
					self.imageUploadForm = $('.customImageFormContainer');
					
				}).error(function(){
					ThreeAIncView.hideAjaxBackground();
					self.showErrorMessage('Impossible de récupérer les campagnes, veuillez réessayer plus tard.');
				});

		},

		uploadCustomImage : function(evt){

			evt.preventDefault();
			var 	errorCustomImageInputs 	= false,
				errorInputFile 			= false,
				self 				= this;

			var generalValidation = $('#uploadImageBannerForm').find($('input.validation'));
					if(generalValidation.length > 0){
						errorCustomImageInputs=ThreeAIncView.validateInputs(generalValidation);		
			}

			var inputFile = $('#customImage');

			if(inputFile.val() ==''){
				errorInputFile = true;
				inputFile.closest('div.field-box').addClass('error');
				inputFile.next('br').next('.alert-msg').fadeIn();
			}

			if(!errorCustomImageInputs && !errorInputFile){

				ThreeAIncView.showAjaxBackground();

				var options  = {
					data : {form:$(evt.target).serialize()},
					error: function(xhr) {
									ThreeAIncView.hideAjaxBackground();
									console.log(xhr.status);
								},
					success: function(footer) {
									ThreeAIncView.hideAjaxBackground();
									self.imageUploadForm.fadeOut(function(){
										var templateConfig = {backOfficeLinks:footer};
										self.$el.append(showLinkTemplate(templateConfig));
										self.$el.hide().fadeIn();
									});
					}
				};
				$(evt.target).ajaxSubmit(options);
			}
		},

		backToForm : function(){
			$('#custom-image-bo').fadeOut(function(){
						$(this).remove();
						$('.customImageFormContainer').find('#customImage').val('');
						$('.customImageFormContainer').fadeIn();	
			});
		},

		clearErrors : function(evt){
			ThreeAIncView.fadeOutErrors(evt);
		},

		clearErrorInput : function(evt){
			$(evt.target).closest('div.field-box').find('.alert-msg').fadeOut();
		}
	});

	return HeaderCustomImageView;
});
				
